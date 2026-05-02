const { run, get } = require('./db');

const INITIAL_SESSION_DATA = {
  messages: [],
  corrections: [],
  latestContext: {},
  patientProfile: { age: null, sex: '' },
  pendingMedicalMessage: '',
  pendingFollowUp: null,
  remainingQuestions: [],
  answeredQuestions: []
};

/**
 * Get a session from DB or create a new one.
 * Always returns a fresh object from the DB to ensure persistence.
 */
const getSession = async (sessionId, userId = 'guest') => {
  try {
    const row = await get('SELECT data FROM sessions WHERE id = ?', [sessionId]);
    if (row) {
      return { sessionId, ...JSON.parse(row.data) };
    }
    
    // Create new session
    const newData = { ...INITIAL_SESSION_DATA };
    await run('INSERT INTO sessions (id, user_id, data) VALUES (?, ?, ?)', 
      [sessionId, userId, JSON.stringify(newData)]);
    
    return { sessionId, ...newData };
  } catch (err) {
    console.error('[SessionStore] Error getting session:', err.message);
    return { sessionId, ...INITIAL_SESSION_DATA };
  }
};

/**
 * Save session data back to DB
 */
const saveSession = async (sessionId, data) => {
  try {
    const { sessionId: id, ...sessionData } = data;
    await run('UPDATE sessions SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [JSON.stringify(sessionData), sessionId]);
  } catch (err) {
    console.error('[SessionStore] Error saving session:', err.message);
  }
};

/**
 * Update the session's latest structured context
 */
const updateSessionContext = async (sessionId, structuredData) => {
  const session = await getSession(sessionId);
  session.latestContext = structuredData;
  await saveSession(sessionId, session);
  return session;
};

/**
 * Add a correction to the session
 */
const addSessionCorrection = async (sessionId, correctionMessage) => {
  const session = await getSession(sessionId);
  session.corrections.push({
    timestamp: Date.now(),
    message: correctionMessage
  });
  await saveSession(sessionId, session);
  return session;
};

/**
 * Add a generic message to the session history
 */
const addSessionMessage = async (sessionId, role, content) => {
  const session = await getSession(sessionId);
  session.messages.push({
    timestamp: Date.now(),
    role,
    content
  });
  await saveSession(sessionId, session);
  return session;
};

module.exports = {
  getSession,
  saveSession,
  updateSessionContext,
  addSessionCorrection,
  addSessionMessage
};
