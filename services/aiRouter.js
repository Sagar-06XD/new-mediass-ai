const { callGemini } = require('./geminiService');
const { callGroq } = require('./groqService');

async function processMedicalQuery(query, systemPrompt) {
  try {
    console.log('[AI Router] Attempting to use Gemini API...');
    const result = await callGemini(query, systemPrompt);
    console.log('[AI Router] Successfully got response from Gemini.');
    return result;
  } catch (geminiError) {
    console.warn(`[AI Router] Gemini API failed: ${geminiError.message}. Falling back to Groq...`);
    
    try {
      const groqResult = await callGroq(query, systemPrompt);
      console.log('[AI Router] Successfully got response from Groq.');
      return groqResult;
    } catch (groqError) {
      console.error(`[AI Router] Groq API also failed: ${groqError.message}`);
      
      // If both fail, return a default safe response
      return {
        understanding: "We encountered an error processing your request.",
        causes: ["System error", "API unavailable"],
        risk: "Moderate",
        recommendations: ["Please try again later", "If symptoms are severe, seek immediate medical attention."],
        doctor: "General Physician",
        confidence: 0.0,
        emergency: false
      };
    }
  }
}

module.exports = {
  processMedicalQuery
};
