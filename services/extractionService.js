const { processMedicalQuery } = require('./aiRouter');
const { EXTRACTION_PROMPT } = require('../utils/promptTemplate');

async function extractStructuredData(rawMessage) {
  try {
    console.log('[Extraction Service] Extracting structured data from user message...');
    
    // We reuse the AI Router but pass the EXTRACTION_PROMPT as the system prompt
    // The aiRouter returns parsed JSON
    const structuredData = await processMedicalQuery(rawMessage, EXTRACTION_PROMPT);
    
    console.log('[Extraction Service] Successfully extracted data:', structuredData);
    return structuredData;
  } catch (error) {
    console.error('[Extraction Service] Failed to extract data:', error.message);
    // If extraction fails, return empty structure as fallback
    return {
      symptoms: [],
      duration: "",
      severity: "",
      type: "",
      location: "",
      additionalNotes: "Extraction failed"
    };
  }
}

module.exports = {
  extractStructuredData
};
