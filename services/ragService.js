const fs = require('fs');
const { PDFLoader } = require('langchain/document_loaders/fs/pdf');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { v4: uuidv4 } = require('uuid');
const { getVectorStore, saveVectorStore } = require('../rag/vectorStore');

const processUploadedFile = async (filePath, filename) => {
  console.log(`[RAG Service] Processing uploaded file: ${filename}`);

  try {
    let docs = [];

    // 1. Extract text
    if (filename.toLowerCase().endsWith('.pdf')) {
      const loader = new PDFLoader(filePath);
      docs = await loader.load();
    } else if (filename.toLowerCase().endsWith('.txt')) {
      const loader = new TextLoader(filePath);
      docs = await loader.load();
    } else {
      throw new Error('Unsupported file type');
    }

    if (!docs || docs.length === 0) {
      throw new Error('No valid text could be extracted from the document');
    }

    // 2. Clean and preprocess metadata
    docs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        source: filename,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      };
    });

    // 3. Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    
    const chunks = await textSplitter.splitDocuments(docs);
    console.log(`[RAG Service] Split document into ${chunks.length} chunks.`);

    // 4. Generate embeddings and store in vector database
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);
    await saveVectorStore(vectorStore);

    console.log(`[RAG Service] Successfully ingested ${filename} into Vector Database!`);
    
    // Clean up temporary uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`[RAG Service] Error processing file ${filename}:`, error.message);
    // Attempt cleanup on failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

const processRawText = async (text) => {
  console.log(`[RAG Service] Processing raw text input...`);

  try {
    if (!text || text.trim() === '') {
      throw new Error('No valid text provided');
    }

    // 1. Create a dummy document structure that textSplitter expects
    const docs = [{
      pageContent: text,
      metadata: {
        source: 'manual_text_input',
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }
    }];

    // 2. Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    
    const chunks = await textSplitter.splitDocuments(docs);
    console.log(`[RAG Service] Split text into ${chunks.length} chunks.`);

    // 3. Generate embeddings and store in vector database
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);
    await saveVectorStore(vectorStore);

    console.log(`[RAG Service] Successfully ingested raw text into Vector Database!`);
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
