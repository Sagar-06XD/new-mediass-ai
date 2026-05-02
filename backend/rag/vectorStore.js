const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib');
const path = require('path');
const fs = require('fs');

const VECTOR_STORE_PATH = path.join(__dirname, '../data/vector_store');
const EMBEDDING_MODEL = 'models/gemini-embedding-001';

// Maximum texts per batch request to avoid API limits
const BATCH_SIZE = 5;

// Cache instances per user
const vectorStoreInstances = {};

const getVectorStorePath = (userId) => {
  return path.join(__dirname, `../data/user_${userId}/vector_store`);
};

class GeminiEmbeddings {
  constructor({ apiKey }) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for embeddings');
    }
    this.apiKey = apiKey;
  }

  async _embedBatch(texts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:batchEmbedContents?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
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

  async embedDocuments(texts) {
    const cleanTexts = texts.map((text) => String(text || '').replace(/\n/g, ' ').slice(0, 2000));

    // Process in small batches to avoid Gemini API rate limits
    const allEmbeddings = [];
    for (let i = 0; i < cleanTexts.length; i += BATCH_SIZE) {
      const batch = cleanTexts.slice(i, i + BATCH_SIZE);
      console.log(`[Embeddings] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cleanTexts.length / BATCH_SIZE)} (${batch.length} texts)`);

      let retries = 3;
      let batchEmbeddings = null;

      while (retries > 0) {
        try {
          batchEmbeddings = await this._embedBatch(batch);
          break;
        } catch (err) {
          retries--;
          console.warn(`[Embeddings] Batch failed (${retries} retries left): ${err.message}`);
          if (retries > 0) {
            // Wait before retry (exponential backoff)
            const delay = (3 - retries) * 2000;
            console.log(`[Embeddings] Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw err;
          }
        }
      }

      allEmbeddings.push(...batchEmbeddings);

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < cleanTexts.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return allEmbeddings;
  }

  async embedQuery(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${this.apiKey}`;

    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text: String(text || '').replace(/\n/g, ' ').slice(0, 2000) }] },
            taskType: 'RETRIEVAL_QUERY',
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || 'Gemini embedding request failed');
        }
        return data.embedding?.values || [];
      } catch (err) {
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          throw err;
        }
      }
    }
  }
}

const getEmbeddings = () => {
  return new GeminiEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
  });
};

const getVectorStore = async (userId) => {
  if (!userId) throw new Error('userId is required to get vector store');
  if (vectorStoreInstances[userId]) return vectorStoreInstances[userId];

  const storePath = getVectorStorePath(userId);

  try {
    // If the directory exists, try to load it
    if (fs.existsSync(storePath)) {
      console.log(`[VectorStore] Loading existing vector database for user ${userId}...`);
      vectorStoreInstances[userId] = await HNSWLib.load(
        storePath,
        getEmbeddings()
      );
      console.log(`[VectorStore] Loaded successfully for user ${userId}.`);
    } else {
      console.log(`[VectorStore] No existing DB found for user ${userId}. Will initialize empty store.`);
      // Create an empty dummy store just so we have the object
      // We need to initialize it with at least one document to define dimensions
      const dummyDocs = [{ pageContent: "Initialization dummy text", metadata: { source: "system" } }];
      vectorStoreInstances[userId] = await HNSWLib.fromTexts(
        dummyDocs.map(d => d.pageContent),
        dummyDocs.map(d => d.metadata),
        getEmbeddings()
      );
      // Save the initialized store
      if (!fs.existsSync(storePath)) {
        fs.mkdirSync(storePath, { recursive: true });
      }
      await vectorStoreInstances[userId].save(storePath);
    }
  } catch (error) {
    console.error(`[VectorStore] Failed to load vector store for user ${userId}:`, error.message);
  }

  return vectorStoreInstances[userId];
};

const saveVectorStore = async (userId, store) => {
  try {
    const storePath = getVectorStorePath(userId);
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath, { recursive: true });
    }
    await store.save(storePath);
    vectorStoreInstances[userId] = store;
    console.log(`[VectorStore] Saved successfully to disk for user ${userId}.`);
  } catch (error) {
    console.error(`[VectorStore] Error saving vector store for user ${userId}:`, error.message);
  }
};

// Reset cached instance (useful after training new data)
const resetVectorStore = (userId) => {
  if (userId && vectorStoreInstances[userId]) {
    delete vectorStoreInstances[userId];
    console.log(`[VectorStore] Cache cleared for user ${userId}. Will reload from disk on next access.`);
  }
};

module.exports = {
  getEmbeddings,
  getVectorStore,
  saveVectorStore,
  resetVectorStore
};
