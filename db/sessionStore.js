// In-memory session store (Replace with Redis or similar in production)
const sessions = {};

/**
 * Get or create a session by ID
 */
const getSession = (sessionId) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      sessionId,
      messages: [],
      corrections: [],
      latestContext: {},
      patientProfile: {
        age: null,
        sex: ''
      },
      pendingMedicalMessage: '',
      pendingFollowUp: null
    };
  }
  return sessions[sessionId];
};

/**
 * Update the session's latest structured context
 */
const updateSessionContext = (sessionId, structuredData) => {
  const session = getSession(sessionId);
  session.latestContext = structuredData;
  return session;
};

/**
 * Add a correction to the session
 */
const addSessionCorrection = (sessionId, correctionMessage) => {
  const session = getSession(sessionId);
  session.corrections.push({
    timestamp: Date.now(),
    message: correctionMessage
  });
  return session;
};

/**
 * Add a generic message to the session history
 */
const addSessionMessage = (sessionId, role, content) => {
  const session = getSession(sessionId);
  session.messages.push({
    timestamp: Date.now(),
    role,
    content
  });
  return session;
};

module.exports = {
  getSession,
  updateSessionContext,
  addSessionCorrection,
  addSessionMessage
};
