const { getSession, addSessionCorrection, updateSessionContext } = require('../db/sessionStore');

const correctionKeywords = [
  "no",
  "not",
  "wrong",
  "instead",
  "actually",
  "incorrect",
  "don't have",
  "do not have"
];

/**
 * Detects if the user's message is a correction to a previous AI response.
 */
const detectCorrection = (message) => {
  const lowercaseMsg = message.toLowerCase();
  
  // A simple heuristic: if the message starts with or strongly features correction words
  for (const keyword of correctionKeywords) {
    if (lowercaseMsg.includes(keyword)) {
      return true;
    }
  }
  return false;
};

/**
 * Updates the session with the new correction and modifies the structured data context.
 * In a more advanced implementation, this might call an LLM to smartly patch the JSON.
 * For now, we store the correction text directly so the main AI prompt can pivot.
 */
const updateContext = async (sessionId, message, newStructuredData) => {
  // Add the raw correction to the session memory
  addSessionCorrection(sessionId, message);
  
  const session = getSession(sessionId);
  
  // Merge the new structured data (from the intake layer) with the latest context
  const mergedContext = {
    ...session.latestContext,
    ...newStructuredData
  };
  
  // If the user said "no muscle pain", we might want to drop "muscle" from symptoms,
  // but since we rely on the LLM to process the raw correction string alongside the structured data,
  // simply storing both is highly effective.
  updateSessionContext(sessionId, mergedContext);
  
  return getSession(sessionId);
};

module.exports = {
  detectCorrection,
  updateContext
};
