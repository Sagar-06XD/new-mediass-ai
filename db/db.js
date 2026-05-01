const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  const initialData = {
    users: {
      'demo-user': { id: 'demo-user', name: 'Demo User', created_at: Date.now() }
    },
    interactions: [],
    health_profiles: {
      'demo-user': {
        user_id: 'demo-user',
        known_conditions: ['diabetes'],
        allergies: ['penicillin']
      }
    }
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

const getDB = () => {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const saveDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

module.exports = {
  getDB,
  saveDB
};
