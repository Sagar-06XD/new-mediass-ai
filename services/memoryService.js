const { getDB, saveDB } = require('../db/db');

const saveInteraction = async (userId, message, structuredData, aiResponse) => {
  const db = getDB();
  
  const newInteraction = {
    id: Date.now().toString(),
    user_id: userId,
    message: message,
    structured_data: structuredData,
    ai_response: aiResponse,
    timestamp: Date.now()
  };

  db.interactions.push(newInteraction);
  saveDB(db);
  
  console.log(`[MemoryService] Saved interaction for user ${userId}`);
  return newInteraction;
};

const getRecentHistory = async (userId, limit = 5) => {
  const db = getDB();
  const userInteractions = db.interactions
    .filter(i => i.user_id === userId)
    .sort((a, b) => b.timestamp - a.timestamp) // Sort descending
    .slice(0, limit)
    .reverse(); // Reverse back to chronological order
    
  return userInteractions;
};

const getHealthProfile = async (userId) => {
  const db = getDB();
  return db.health_profiles[userId] || { conditions: [], allergies: [] };
};

module.exports = {
  saveInteraction,
  getRecentHistory,
  getHealthProfile
};
