const { processMedicalQuery } = require('../services/aiRouter');
const { extractStructuredData } = require('../services/extractionService');
const { retrieveContext } = require('../rag/retriever');
const { saveInteraction, getRecentHistory, getHealthProfile } = require('../services/memoryService');
const { checkEmergency } = require('../services/safetyService');
const { getNearbyDoctors } = require('../services/doctorService');
const { detectCorrection, updateContext } = require('../services/feedbackService');
const { getSession, addSessionMessage } = require('../db/sessionStore');
const { MASTER_PROMPT } = require('../utils/promptTemplate');
const { detectIntent } = require('../services/intentService');

const normalizeSex = (text) => {
  const lower = text.toLowerCase();
  if (/\b(male|man|boy|m)\b/.test(lower)) return 'male';
  if (/\b(female|woman|girl|f)\b/.test(lower)) return 'female';
  if (/\b(other|nonbinary|non-binary|transgender|prefer not)\b/.test(lower)) return 'other';
  return '';
};

const extractAge = (text) => {
  const ageMatch = text.match(/\b(?:age\s*)?(\d{1,3})\s*(?:years?\s*old|yrs?\s*old|yo|y\/o|years?|yrs?)?\b/i);
  if (!ageMatch) return null;
  const age = Number(ageMatch[1]);
  return age > 0 && age < 130 ? age : null;
};

const updatePatientProfileFromMessage = (session, message) => {
  const age = extractAge(message);
  const sex = normalizeSex(message);
  if (age && !session.patientProfile.age) session.patientProfile.age = age;
  if (sex && !session.patientProfile.sex) session.patientProfile.sex = sex;
  return session.patientProfile;
};

const missingPatientFields = (profile) => {
  const missing = [];
  if (!profile.age) missing.push('age');
  if (!profile.sex) missing.push('sex');
  return missing;
};

const profileQuestion = (missing) => {
  if (missing.includes('age') && missing.includes('sex')) {
    return 'Before I assess this, please tell me the patient age and sex, for example: "28, female" or "45, male".';
  }
  if (missing.includes('age')) {
    return 'What is the patient age?';
  }
  return 'What is the patient sex? Please answer male, female, or other.';
};

const getSymptomKey = (structuredData, rawMessage) => {
  const text = `${(structuredData.symptoms || []).join(' ')} ${rawMessage}`.toLowerCase();
  if (/chest|heart|arm pain|jaw/.test(text)) return 'chest_pain';
  if (/headache|head pain|migraine/.test(text)) return 'headache';
  if (/fever|temperature|chills/.test(text)) return 'fever';
  if (/cough|sore throat|cold|runny nose/.test(text)) return 'respiratory';
  if (/breath|dyspnea|wheez|blue lips/.test(text)) return 'breathing';
  if (/stomach|abdominal|belly|vomit|diarrhea|nausea/.test(text)) return 'abdominal';
  if (/rash|itch|swelling|skin|hives|blister/.test(text)) return 'skin';
  if (/dizz|vertigo|faint|balance/.test(text)) return 'dizziness';
  return 'general';
};

const buildFollowUpQuestions = (structuredData, rawMessage, profile) => {
  const symptomKey = getSymptomKey(structuredData, rawMessage);
  const common = [
    'When did this start, and is it getting better, worse, or staying the same?',
    'How severe is it from 1 to 10?'
  ];

  const questionMap = {
    chest_pain: [
      ...common,
      'Does the pain spread to the left arm, jaw, back, or shoulder?',
      'Do you also have shortness of breath, sweating, nausea, dizziness, or fainting?'
    ],
    headache: [
      ...common,
      'Did it start suddenly like the worst headache of life?',
      'Do you have fever, neck stiffness, vomiting, weakness, confusion, vision change, or recent head injury?'
    ],
    fever: [
      'What is the highest temperature you measured?',
      'How many days have you had fever?',
      'Do you also have cough, sore throat, headache, neck stiffness, rash, burning urine, belly pain, vomiting, or diarrhea?'
    ],
    respiratory: [
      ...common,
      'Do you have fever, chest pain, wheezing, shortness of breath, or blood in sputum?',
      'Is the cough dry or with mucus? If mucus, what color?'
    ],
    breathing: [
      'Did the breathing problem start suddenly or gradually?',
      'Can the patient speak full sentences comfortably?',
      'Is there chest pain, blue lips, wheezing, swelling of face/tongue, or leg swelling?'
    ],
    abdominal: [
      ...common,
      'Where exactly is the pain: upper, lower, right, left, or around the belly button?',
      'Any fever, vomiting, diarrhea, constipation, blood in stool, burning urine, pregnancy possibility, or yellow eyes?'
    ],
    skin: [
      ...common,
      'Is there fever, skin pain, blisters, peeling, mouth/eye sores, facial swelling, or trouble breathing?',
      'Did it start after a new medicine, food, insect bite, or exposure?'
    ],
    dizziness: [
      ...common,
      'Is it spinning vertigo, lightheadedness, or feeling like fainting?',
      'Any weakness, slurred speech, double vision, chest pain, palpitations, severe headache, or trouble walking?'
    ],
    general: [
      ...common,
      'Please list all symptoms together, including location, duration, triggers, and anything that makes it better or worse.'
    ]
  };

  const questions = questionMap[symptomKey] || questionMap.general;
  return {
    symptomKey,
    questions,
    text: `Thanks. I have the patient as ${profile.age} years old, ${profile.sex}. To narrow this down, please answer these follow-up questions:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
  };
};

const mergeContext = (base, next) => ({
  ...base,
  ...next,
  symptoms: Array.from(new Set([...(base.symptoms || []), ...(next.symptoms || [])].filter(Boolean))),
  additionalNotes: [base.additionalNotes, next.additionalNotes].filter(Boolean).join(' | ')
});

const handleChatQuery = async (req, res) => {
  try {
    const { message, userId = 'demo-user', sessionId = 'default-session' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let session = getSession(sessionId);
    const isPendingIntake = Boolean(session.pendingMedicalMessage || session.pendingFollowUp);

    // ─── STEP 0: Intent Detection Gate ────────────────────────────────────────
    const intent = isPendingIntake ? 'medical' : detectIntent(message);
    console.log(`[ChatController] Intent detected: "${intent}" for message: "${message}"`);

    // Record raw message to session regardless of intent
    addSessionMessage(sessionId, 'user', message);

    if (intent === 'greeting' || intent === 'general') {
      const { generateChatText } = require('../services/geminiService');
      const chatResponseText = await generateChatText(message);
      
      const chatResponse = {
        intent: intent,
        text: chatResponseText,
      };
      addSessionMessage(sessionId, 'ai', chatResponse);
      return res.json(chatResponse);
    }

    updatePatientProfileFromMessage(session, message);

    if (!session.pendingMedicalMessage && !session.pendingFollowUp) {
      session.pendingMedicalMessage = message;
    }

    const missingProfile = missingPatientFields(session.patientProfile);
    if (missingProfile.length > 0) {
      const followupResponse = {
        intent: 'followup',
        text: profileQuestion(missingProfile),
        neededFields: missingProfile
      };
      addSessionMessage(sessionId, 'ai', followupResponse);
      return res.json(followupResponse);
    }

    const currentMedicalMessage = [
      session.pendingMedicalMessage,
      session.pendingFollowUp ? `Follow-up answers: ${message}` : ''
    ].filter(Boolean).join('\n');

    // ─── STEP 1: Only medical queries reach here ───────────────────────────────
    // Extract structured data from the raw message (Intake Layer)
    const structuredData = await extractStructuredData(currentMedicalMessage);
    session.latestContext = mergeContext(session.latestContext || {}, structuredData);

    // ─── STEP 2: Safety & Triage Layer Check ──────────────────────────────────
    const safetyStatus = checkEmergency(currentMedicalMessage, structuredData);

    // If emergency detected, SKIP RAG, Memory, and AI call
    if (safetyStatus.emergency) {
      console.log('[ChatController] Emergency detected! Skipping RAG & AI.');
      const emergencyResponse = {
        intent: 'medical',
        understanding: "You may be experiencing a serious condition based on your symptoms.",
        causes: ["Possible life-threatening condition"],
        risk: "High",
        recommendations: [
          "Seek immediate medical attention",
          "Visit nearest hospital or call emergency services"
        ],
        doctor: "Emergency Medicine",
        confidence: 0.95,
        emergency: true,
        sources: [],
        updated: false
      };
      await saveInteraction(userId, message, structuredData, emergencyResponse);
      addSessionMessage(sessionId, 'ai', emergencyResponse);
      session.pendingMedicalMessage = '';
      session.pendingFollowUp = null;
      return res.json(emergencyResponse);
    }

    if (!session.pendingFollowUp && !safetyStatus.emergency) {
      const followUp = buildFollowUpQuestions(structuredData, currentMedicalMessage, session.patientProfile);
      session.pendingFollowUp = {
        symptomKey: followUp.symptomKey,
        questions: followUp.questions,
        originalMessage: session.pendingMedicalMessage
      };
      const followupResponse = {
        intent: 'followup',
        text: followUp.text,
        symptomKey: followUp.symptomKey,
        questions: followUp.questions
      };
      addSessionMessage(sessionId, 'ai', followupResponse);
      return res.json(followupResponse);
    }

    // ─── STEP 3: Feedback Loop - Detect Corrections ───────────────────────────
    const isCorrection = detectCorrection(message);
    let isUpdated = false;

    if (isCorrection) {
      console.log('[ChatController] User correction detected! Updating session context...');
      session = await updateContext(sessionId, message, structuredData);
      isUpdated = true;
    } else {
      getSession(sessionId);
    }

    // ─── STEP 4: Memory Retrieval ─────────────────────────────────────────────
    const userHistory = await getRecentHistory(userId);
    const healthProfile = await getHealthProfile(userId);

    // ─── STEP 5: RAG Retrieval ────────────────────────────────────────────────
    const retrievalResult = await retrieveContext(currentMedicalMessage);

    // ─── STEP 6: Prepare combined payload for AI reasoning ────────────────────
    const payload = {
      structuredData: session.latestContext && Object.keys(session.latestContext).length > 0
        ? session.latestContext
        : structuredData,
      patientProfile: session.patientProfile,
      followUpAnswers: session.pendingFollowUp ? message : '',
      retrievedContext: retrievalResult.context,
      userHistory: userHistory,
      healthProfile: healthProfile,
      sessionCorrections: session.corrections.map(c => c.message)
    };

    // ─── STEP 7: AI Reasoning ─────────────────────────────────────────────────
    const queryPayload = JSON.stringify(payload, null, 2);
    let aiResponse = await processMedicalQuery(queryPayload, MASTER_PROMPT);

    // Tag intent so frontend knows this is a medical response
    aiResponse.intent = 'medical';
    aiResponse.updated = isUpdated;

    // Attach sources from the retrieval phase if the AI didn't include them
    if (!aiResponse.sources || aiResponse.sources.length === 0) {
      aiResponse.sources = retrievalResult.sources;
    }

    // Override the AI's risk assessment with our deterministic Safety & Triage check
    aiResponse.risk = safetyStatus.risk;
    aiResponse.emergency = false;

    // ─── STEP 8: Fetch Doctors if a specialist is recommended ─────────────────
    if (aiResponse.doctor && aiResponse.doctor.trim() !== '') {
      console.log(`[ChatController] Fetching doctors for specialist: ${aiResponse.doctor}`);
      const doctors = await getNearbyDoctors(aiResponse.doctor);
      aiResponse.doctors = doctors;
    } else {
      aiResponse.doctors = [];
    }

    // ─── STEP 9: Save Interaction to Memory and Session ───────────────────────
    await saveInteraction(userId, message, structuredData, aiResponse);
    addSessionMessage(sessionId, 'ai', aiResponse);
    session.pendingMedicalMessage = '';
    session.pendingFollowUp = null;

    return res.json(aiResponse);

  } catch (error) {
    console.error('Chat Controller Error:', error);
    res.status(500).json({
      intent: 'error',
      text: "An unexpected server error occurred. Please try again.",
      understanding: "An unexpected server error occurred.",
      causes: ["Server error"],
      risk: "Moderate",
      recommendations: ["Please try again later"],
      doctor: "General Physician",
      confidence: 0.0,
      emergency: false
    });
  }
};

module.exports = {
  handleChatQuery
};
