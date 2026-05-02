const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib');
const { getEmbeddings, saveVectorStore, getVectorStore } = require('./vectorStore');

const DOCS_DIR = path.join(__dirname, '../data/medical_docs');

async function ingestDocuments() {
  console.log('[Ingest] Starting document ingestion process...');
  
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    console.log('[Ingest] Created medical_docs directory. Please add PDFs or TXTs and run again.');
    return;
  }

  const files = fs.readdirSync(DOCS_DIR);
  if (files.length === 0) {
    console.log('[Ingest] No files found in data/medical_docs/.');
    return;
  }

  let allDocs = [];

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    let docs = [];
    
    try {
      if (file.endsWith('.pdf')) {
        console.log(`[Ingest] Loading PDF: ${file}`);
        const loader = new PDFLoader(filePath);
        docs = await loader.load();
      } else if (file.endsWith('.txt')) {
        console.log(`[Ingest] Loading Text: ${file}`);
        const loader = new TextLoader(filePath);
        docs = await loader.load();
      } else if (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')) {
        console.log(`[Ingest] Loading Excel/CSV: ${file}`);
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(filePath);
        const groupId = require('uuid').v4();
        
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          rows.forEach((row, rowIndex) => {
            const sentence = Object.entries(row)
              .filter(([, val]) => String(val).trim() !== '')
              .map(([col, val]) => `${col}: ${val}`)
              .join(' | ');
            
            if (sentence.trim().length >= 10) {
              docs.push({
                pageContent: sentence,
                metadata: { source: file, sheet: sheetName, row: rowIndex + 1, groupId }
              });
            }
          });
        });
      }
      
      allDocs.push(...docs);
    } catch (err) {
      console.error(`[Ingest] Error loading file ${file}:`, err.message);
    }
  }

  if (allDocs.length === 0) {
    console.log('[Ingest] No valid text extracted from documents.');
    return;
  }

  // Split into chunks
  console.log(`[Ingest] Extracted ${allDocs.length} pages/documents. Splitting into chunks...`);
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const chunks = await textSplitter.splitDocuments(allDocs);
  console.log(`[Ingest] Generated ${chunks.length} chunks. Creating vector embeddings...`);

  // Create Vector Store from all chunks
  const vectorStore = await HNSWLib.fromDocuments(chunks, getEmbeddings());
  
  // Save to disk
  await saveVectorStore(vectorStore);
  console.log('[Ingest] Ingestion complete. Knowledge base is ready!');
}

// Allow running directly from command line
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  ingestDocuments().then(() => process.exit(0));
}

module.exports = {
  ingestDocuments
};
