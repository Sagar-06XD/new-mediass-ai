const fs = require('fs');
const path = require('path');
const { processRawText } = require('./ragService');

/**
 * SelfLearningService allows the AI to learn from its mistakes.
 * When a user corrects the AI, we save the correction and "train" the AI
 * so it doesn't make the same mistake again.
 */

const getLearningPath = (userId) => {
  const dir = path.join(__dirname, '..', 'data', `user_${userId}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'learned_corrections.json');
};

const loadCorrections = (userId) => {
  const filePath = getLearningPath(userId);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
};

const saveCorrection = (userId, correctionData) => {
  const corrections = loadCorrections(userId);
  corrections.push({
    timestamp: new Date().toISOString(),
    ...correctionData
  });
  fs.writeFileSync(getLearningPath(userId), JSON.stringify(corrections, null, 2));
};

/**
 * Analyzes a message to see if it's a correction of a previous AI mistake.
 * If so, it saves the correction and returns true.
 */
const learnFromCorrection = async (userId, userMessage, lastAiResponse) => {
  // Simple heuristic for detecting correction
  const lowerMsg = userMessage.toLowerCase();
  const correctionKeywords = ['not', 'wrong', 'mistake', 'actually', 'incorrect', 'instead', 'no'];
  
  if (correctionKeywords.some(k => lowerMsg.includes(k)) && lastAiResponse) {
    // If user says "it is not skin, it is stomach"
    // We can "train" the AI on this specific mapping
    const trainingText = `Correction: When a user mentions symptoms like "${userMessage}", the correct assessment should consider it as a priority over previous assumptions. User stated: ${userMessage}. Previous AI thought: ${JSON.stringify(lastAiResponse.understanding || lastAiResponse.text)}`;
    
    await processRawText(userId, trainingText, 'self_learning_correction');
    
    saveCorrection(userId, {
      userMessage,
      previousAiResponse: lastAiResponse,
      learnedFact: trainingText
    });
    
    return true;
  }
  return false;
};

module.exports = {
  learnFromCorrection,
  loadCorrections
};
