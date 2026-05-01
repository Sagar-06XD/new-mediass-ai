const { getVectorStore } = require('./vectorStore');

async function retrieveContext(query, k = 4) {
  try {
    const startTime = Date.now();
    console.log(`[Retriever] Searching vector DB for query: "${query}"...`);
    
    const store = await getVectorStore();
    if (!store) {
      console.warn('[Retriever] Vector store not initialized or empty. Returning empty context.');
      return { context: [], sources: [] };
    }

    // Search top k results
    const results = await store.similaritySearch(query, k);
    
    const contextTexts = [];
    const sources = [];

    results.forEach(doc => {
      contextTexts.push(doc.pageContent);
      if (doc.metadata && doc.metadata.source) {
        // Extract filename from the source path
        const filename = doc.metadata.source.split('/').pop().split('\\').pop();
        if (!sources.includes(filename)) {
          sources.push(filename);
        }
      }
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Retriever] Retrieved ${results.length} chunks in ${elapsed}ms.`);

    return {
      context: contextTexts,
      sources: sources
    };
  } catch (error) {
    console.error('[Retriever] Error retrieving context:', error.message);
    return { context: [], sources: [] };
  }
}

module.exports = {
  retrieveContext
};
