const { callGemini } = require('./geminiService');
const { callGroq } = require('./groqService');

let geminiBlockedUntil = 0;
let groqBlocked = false;
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 15000);

const unavailableResponse = {
  understanding: "We encountered an error processing your request.",
  causes: ["System error", "API unavailable"],
  risk: "Moderate",
  recommendations: ["Please try again later", "If symptoms are severe, seek immediate medical attention."],
  doctor: "General Physician",
  confidence: 0.0,
  emergency: false
};

const withTimeout = (promise, timeoutMs, label) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
};

async function processMedicalQuery(query, systemPrompt) {
  if (Date.now() < geminiBlockedUntil && groqBlocked) {
    return { ...unavailableResponse };
  }

  try {
    if (Date.now() >= geminiBlockedUntil) {
      console.log('[AI Router] Attempting to use Gemini API...');
      const result = await withTimeout(callGemini(query, systemPrompt), AI_TIMEOUT_MS, 'Gemini API');
      console.log('[AI Router] Successfully got response from Gemini.');
      return result;
    }
  } catch (geminiError) {
    console.warn(`[AI Router] Gemini API failed: ${geminiError.message}. Falling back to Groq...`);
    geminiBlockedUntil = Date.now() + 60_000;
  }
    
  if (groqBlocked) {
    return { ...unavailableResponse };
  }

  try {
    const groqResult = await withTimeout(callGroq(query, systemPrompt), AI_TIMEOUT_MS, 'Groq API');
    console.log('[AI Router] Successfully got response from Groq.');
    return groqResult;
  } catch (groqError) {
    console.error(`[AI Router] Groq API also failed: ${groqError.message}`);
    if (/invalid api key|401/i.test(groqError.message)) {
      groqBlocked = true;
    }
    return { ...unavailableResponse };
  }
}

module.exports = {
  processMedicalQuery
};
