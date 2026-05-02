const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { callGeminiStructured } = require('../services/geminiService');
const { processRawText } = require('../services/ragService');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DOCS_DIR = path.join(__dirname, '../data/medical_docs');
const USER_ID = 'c99f2e9a-cb77-4c34-8e51-21b4eb14989d'; // Using the active user ID

const EXTRACTION_PROMPT = `
You are a medical knowledge extraction expert.
Identify any medical conditions, illnesses, or symptoms mentioned in the text.
Return ONLY a JSON array of objects.
Each object MUST have: "condition", "symptoms", "causes", "solution".
If nothing found, return empty array [].
`;

async function analyzeDocuments() {
  console.log('[DeepAnalyze] Starting deep analysis of medical documents...');
  
  if (!fs.existsSync(DOCS_DIR)) {
    console.log('[DeepAnalyze] medical_docs directory not found.');
    return;
  }

  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.pdf'));
  console.log(`[DeepAnalyze] Found ${files.length} PDFs to analyze.`);

  for (const file of files) {
    console.log(`\n--- Analyzing: ${file} ---`);
    const filePath = path.join(DOCS_DIR, file);
    
    try {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 3000,
        chunkOverlap: 300,
      });

      const chunks = await textSplitter.splitDocuments(docs);
      console.log(`[DeepAnalyze] Split ${file} into ${chunks.length} chunks.`);

      // To avoid overwhelming the API, we'll process chunks in batches or limit per file
      const processingLimit = Math.min(chunks.length, 5);
      
      for (let i = 0; i < processingLimit; i++) {
        process.stdout.write(`  Processing chunk ${i+1}/${processingLimit}... `);
        
        const text = chunks[i].pageContent;
        
        try {
          const result = await callGeminiStructured(text, EXTRACTION_PROMPT);
          
          if (Array.isArray(result) && result.length > 0) {
            for (const fact of result) {
              const factText = `Condition: ${fact.condition}. Symptoms: ${fact.symptoms}. Causes: ${fact.causes}. Solution: ${fact.solution}.`;
              await processRawText(USER_ID, factText, `deep_analysis_${file}`);
            }
            console.log(`Extracted ${result.length} facts.`);
          } else {
            console.log('No facts found.');
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.log(`Error: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`[DeepAnalyze] Error processing ${file}:`, err.message);
    }
  }

  console.log('\n[DeepAnalyze] Analysis complete. Training corpus updated.');
}

analyzeDocuments();
