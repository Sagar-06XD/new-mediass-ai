const { run, all, get } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const saveInteraction = async (userId, message, structuredData, aiResponse) => {
  const id = uuidv4();
  
  await run(
    'INSERT INTO history (id, user_id, question, answer, structured_data) VALUES (?, ?, ?, ?, ?)',
    [id, userId, message, JSON.stringify(aiResponse), JSON.stringify(structuredData)]
  );
  
  console.log(`[MemoryService] Saved interaction for user ${userId}`);
  return { id, user_id: userId, message, structured_data: structuredData, ai_response: aiResponse };
};

const getRecentHistory = async (userId, limit = 5) => {
  const rows = await all(
    'SELECT * FROM history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
    [userId, limit]
  );
  
  return rows.reverse().map(row => ({
    id: row.id,
    user_id: row.user_id,
    message: row.question,
    ai_response: row.answer ? JSON.parse(row.answer) : {},
    structured_data: row.structured_data ? JSON.parse(row.structured_data) : {},
    timestamp: row.timestamp
  }));
};

const getHealthProfile = async (userId) => {
  const profile = await get('SELECT * FROM health_profiles WHERE user_id = ?', [userId]);
  if (!profile) return { age: null, sex: '', conditions: [], allergies: [] };
  
  return {
    age: profile.age,
    sex: profile.sex || '',
    conditions: profile.known_conditions ? JSON.parse(profile.known_conditions) : [],
    allergies: profile.allergies ? JSON.parse(profile.allergies) : []
  };
};

const saveHealthProfile = async (userId, profile) => {
  const { age, sex, conditions = [], allergies = [] } = profile;
  const existing = await get('SELECT user_id FROM health_profiles WHERE user_id = ?', [userId]);
  
  if (existing) {
    await run(
      'UPDATE health_profiles SET age = ?, sex = ?, known_conditions = ?, allergies = ? WHERE user_id = ?',
      [age, sex, JSON.stringify(conditions), JSON.stringify(allergies), userId]
    );
  } else {
    await run(
      'INSERT INTO health_profiles (user_id, age, sex, known_conditions, allergies) VALUES (?, ?, ?, ?, ?)',
      [userId, age, sex, JSON.stringify(conditions), JSON.stringify(allergies)]
    );
  }
};

module.exports = {
  saveInteraction,
  getRecentHistory,
  getHealthProfile,
  saveHealthProfile
};
