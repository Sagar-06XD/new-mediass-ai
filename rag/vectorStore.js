const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib');
const path = require('path');
const fs = require('fs');

const VECTOR_STORE_PATH = path.join(__dirname, '../data/vector_store');
const EMBEDDING_MODEL = 'models/gemini-embedding-001';

let vectorStoreInstance = null;

class GeminiEmbeddings {
  constructor({ apiKey }) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for embeddings');
    }
    this.apiKey = apiKey;
  }

  async embedDocuments(texts) {
    const cleanTexts = texts.map((text) => String(text || '').replace(/\n/g, ' '));
    const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:batchEmbedContents?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: cleanTexts.map((text) => ({
          model: EMBEDDING_MODEL,
          content: { parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT',
        })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini batch embedding request failed');
    }
    return data.embeddings.map((embedding) => embedding.values || []);
  }

  async embedQuery(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text: String(text || '').replace(/\n/g, ' ') }] },
        taskType: 'RETRIEVAL_QUERY',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini embedding request failed');
    }
    return data.embedding?.values || [];
  }
}

const getEmbeddings = () => {
  return new GeminiEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const getVectorStore = async () => {
  if (vectorStoreInstance) return vectorStoreInstance;

  try {
    // If the directory exists, try to load it
    if (fs.existsSync(VECTOR_STORE_PATH)) {
      console.log('[VectorStore] Loading existing vector database...');
      vectorStoreInstance = await HNSWLib.load(
        VECTOR_STORE_PATH,
        getEmbeddings()
      );
      console.log('[VectorStore] Loaded successfully.');
    } else {
      console.log('[VectorStore] No existing DB found. Will initialize empty store.');
      // Create an empty dummy store just so we have the object
      // We need to initialize it with at least one document to define dimensions
      const dummyDocs = [{ pageContent: "Initialization dummy text", metadata: { source: "system" } }];
      vectorStoreInstance = await HNSWLib.fromTexts(
        dummyDocs.map(d => d.pageContent),
        dummyDocs.map(d => d.metadata),
        getEmbeddings()
      );
    }
  } catch (error) {
    console.error('[VectorStore] Failed to load vector store:', error.message);
  }

  return vectorStoreInstance;
};

const saveVectorStore = async (store) => {
  try {
    if (!fs.existsSync(VECTOR_STORE_PATH)) {
      fs.mkdirSync(VECTOR_STORE_PATH, { recursive: true });
    }
    await store.save(VECTOR_STORE_PATH);
    vectorStoreInstance = store;
    console.log('[VectorStore] Saved successfully to disk.');
  } catch (error) {
    console.error('[VectorStore] Error saving vector store:', error.message);
  }
};

module.exports = {
  getEmbeddings,
  getVectorStore,
  saveVectorStore
};
