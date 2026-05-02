const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { v4: uuidv4 } = require('uuid');
const { getVectorStore, saveVectorStore, resetVectorStore } = require('../rag/vectorStore');
const XLSX = require('xlsx');

const getCorpusPath = (userId) => {
  const dir = path.join(__dirname, `../data/user_${userId}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'training_corpus.json');
};

const detectCategory = (text) => {
  const lower = String(text || '').toLowerCase();
  const categories = [
    ['abdominal', /\b(stomach|abdominal|abdomen|belly|gas|bloating|indigestion|acidity|vomit|vomiting|nausea|diarrhea|constipation|cramp)\b/],
    ['skin', /\b(rash|skin|itch|itching|hives|blister|peeling|swelling|redness|spots)\b/],
    ['respiratory', /\b(cough|cold|sore throat|runny nose|mucus|wheez|breath|breathing)\b/],
    ['fever', /\b(fever|temperature|chills)\b/],
    ['headache', /\b(headache|migraine|head pain)\b/],
    ['chest_pain', /\b(chest|heart|angina)\b/],
    ['dizziness', /\b(dizzy|dizziness|vertigo|faint|lightheaded)\b/],
  ];
  return categories.find(([, pattern]) => pattern.test(lower))?.[0] || 'general';
};

const detectKnowledgeType = (text) => {
  const lower = String(text || '').toLowerCase();
  if (/\b(symptom|symptoms|sign|signs|complain|presentation)\b/.test(lower)) return 'symptoms';
  if (/\b(cause|causes|because|due to|trigger|reason)\b/.test(lower)) return 'causes';
  if (/\b(home care|remedy|remedies|recommend|advice|treat|treatment|drink|eat|avoid|rest|use|take)\b/.test(lower)) return 'recommendations';
  if (/\b(seek|doctor|hospital|urgent|emergency|danger|red flag|warning|severe|blood|persistent)\b/.test(lower)) return 'red_flags';
  return 'note';
};

const cleanText = (text) => String(text || '')
  .replace(/\r/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const splitIntoKnowledgeUnits = (text) => {
  const normalized = cleanText(text);
  if (!normalized) return [];

  const roughUnits = normalized
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((unit) => unit.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((unit) => unit.length >= 8);

  const units = [];
  roughUnits.forEach((unit) => {
    if (unit.length <= 360) {
      units.push(unit);
      return;
    }

    const parts = unit.match(/.{1,320}(?:\s|$)/g) || [unit];
    parts.map((part) => part.trim()).filter(Boolean).forEach((part) => units.push(part));
  });

  return units;
};

// ── Persistent JSON corpus ──────────────────────────────────────────────────
const saveChunksToCorpus = (userId, chunks, source) => {
  try {
    const corpusPath = getCorpusPath(userId);
    const existing = fs.existsSync(corpusPath)
      ? JSON.parse(fs.readFileSync(corpusPath, 'utf8'))
      : [];

    const entries = chunks.map((chunk) => ({
      id: chunk.metadata?.id || uuidv4(),
      source,
      groupId: chunk.metadata?.groupId || chunk.metadata?.id || uuidv4(),
      category: detectCategory(chunk.pageContent),
      type: chunk.metadata?.type || detectKnowledgeType(chunk.pageContent),
      text: chunk.pageContent,
      createdAt: chunk.metadata?.createdAt || new Date().toISOString()
    }));

    fs.writeFileSync(corpusPath, JSON.stringify([...existing, ...entries], null, 2));
    console.log(`[RAG Service] Saved ${entries.length} chunks to local corpus for user ${userId} (${source}).`);
  } catch (err) {
    console.error('[RAG Service] Error saving to corpus file:', err.message);
  }
};

// ── Chunking helper ─────────────────────────────────────────────────────────
const chunkDocuments = async (docs) => {
  const chunks = [];

  docs.forEach((doc) => {
    splitIntoKnowledgeUnits(doc.pageContent).forEach((unit) => {
      chunks.push({
        pageContent: unit,
        metadata: {
          ...doc.metadata,
          id: uuidv4(),
          category: detectCategory(unit),
          type: detectKnowledgeType(unit)
        }
      });
    });
  });

  if (chunks.length > 0) return chunks;

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 350,
    chunkOverlap: 40,
  });
  return textSplitter.splitDocuments(docs);
};

// ── Add chunks to vector store in safe batches ──────────────────────────────
const addChunksToVectorStore = async (userId, chunks) => {
  const BATCH = 10;
  const vectorStore = await getVectorStore(userId);

  if (!vectorStore) {
    throw new Error('Vector store is not initialized. Check your GEMINI_API_KEY.');
  }

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    console.log(`[RAG Service] Embedding batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(chunks.length / BATCH)} for user ${userId}...`);
    await vectorStore.addDocuments(batch);
  }

  await saveVectorStore(userId, vectorStore);

  // Reset cache so next retrieval picks up the fresh data
  resetVectorStore(userId);
};

// ── Excel / CSV loader ──────────────────────────────────────────────────────
/**
 * Reads an Excel (.xlsx/.xls) or CSV file using SheetJS.
 * Converts each row into a human-readable sentence so the RAG pipeline
 * treats it as natural medical text rather than raw table data.
 *
 * Example row: { Symptom: "fever", Cause: "infection", Treatment: "paracetamol" }
 * Becomes: "Symptom: fever | Cause: infection | Treatment: paracetamol"
 */
const loadExcelOrCsv = (filePath, filename) => {
  const workbook = XLSX.readFile(filePath);
  const docs = [];
  const groupId = uuidv4();

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to array of row objects (header row → keys)
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) return;

    rows.forEach((row, rowIndex) => {
      // Build a natural-language sentence from all columns in this row
      const sentence = Object.entries(row)
        .filter(([, val]) => String(val).trim() !== '')  // skip empty cells
        .map(([col, val]) => `${col}: ${val}`)
        .join(' | ');

      if (sentence.trim().length < 10) return; // skip near-empty rows

      docs.push({
        pageContent: sentence,
        metadata: {
          source: filename,
          sheet: sheetName,
          row: rowIndex + 1,
          groupId,
          id: uuidv4(),
          createdAt: new Date().toISOString()
        }
      });
    });

    console.log(`[RAG Service] Sheet "${sheetName}": ${rows.length} rows → ${docs.length} docs so far.`);
  });

  return docs;
};

// ── Process uploaded file ───────────────────────────────────────────────────
const processUploadedFile = async (userId, filePath, filename) => {
  console.log(`[RAG Service] Processing uploaded file for user ${userId}: ${filename}`);

  try {
    let docs = [];

    // 1. Extract text based on file type
    const ext = path.extname(filename).toLowerCase();

    if (ext === '.pdf') {
      const loader = new PDFLoader(filePath);
      docs = await loader.load();
    } else if (ext === '.txt' || ext === '.md') {
      const loader = new TextLoader(filePath);
      docs = await loader.load();
    } else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      docs = loadExcelOrCsv(filePath, filename);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    if (!docs || docs.length === 0) {
      throw new Error('No valid text could be extracted from the document');
    }

    // 2. Clean and preprocess metadata
    const groupId = uuidv4();
    docs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        source: filename,
        groupId,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      };
    });

    // 3. Split text into chunks
    const chunks = await chunkDocuments(docs);
    console.log(`[RAG Service] Split document into ${chunks.length} chunks.`);

    // 4. Save a local searchable copy FIRST (this always succeeds)
    saveChunksToCorpus(userId, chunks, filename);

    // 5. Generate embeddings when available. Local corpus above is the source of truth.
    try {
      await addChunksToVectorStore(userId, chunks);
    } catch (embeddingError) {
      console.warn(`[RAG Service] Saved file to local corpus, but vector embedding failed: ${embeddingError.message}`);
    }

    console.log(`[RAG Service] Successfully ingested ${filename} into Vector Database for user ${userId}!`);
    
    // Clean up temporary uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return chunks.length;
  } catch (error) {
    console.error(`[RAG Service] Error processing file ${filename}:`, error.message);
    // Attempt cleanup on failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// ── Process raw text ────────────────────────────────────────────────────────
const processRawText = async (userId, text, sourceLabel = 'manual_text_input') => {
  console.log(`[RAG Service] Processing raw text input for user ${userId} (${text.length} chars)...`);

  try {
    if (!text || text.trim() === '') {
      throw new Error('No valid text provided');
    }

    // 1. Create a document structure that textSplitter expects
    const docs = [{
      pageContent: text,
      metadata: {
        source: sourceLabel,
        groupId: uuidv4(),
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }
    }];

    // 2. Split text into chunks
    const chunks = await chunkDocuments(docs);
    console.log(`[RAG Service] Split text into ${chunks.length} chunks.`);

    // 3. Save a local searchable copy FIRST (this always succeeds)
    saveChunksToCorpus(userId, chunks, sourceLabel);

    // 4. Generate embeddings when available. Local corpus above is the source of truth.
    try {
      await addChunksToVectorStore(userId, chunks);
    } catch (embeddingError) {
      console.warn(`[RAG Service] Saved text to local corpus, but vector embedding failed: ${embeddingError.message}`);
    }

    console.log(`[RAG Service] Successfully ingested raw text into Vector Database for user ${userId}!`);
    return chunks.length;
  } catch (error) {
    console.error(`[RAG Service] Error processing raw text:`, error.message);
    throw error;
  }
};

module.exports = {
  processUploadedFile,
  processRawText
};
