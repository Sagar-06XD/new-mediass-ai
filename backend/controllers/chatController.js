const { getSession, saveSession, addSessionMessage } = require('../db/sessionStore');
const { retrieveContext, hasEnoughContext } = require('../rag/retriever');
const { generateChatText, askGeminiFallback } = require('../services/geminiService');
const { processMedicalQuery } = require('../services/aiRouter');
const { checkEmergency } = require('../services/safetyService');
const { extractStructuredData } = require('../services/extractionService');
const { saveInteraction, getRecentHistory, getHealthProfile, saveHealthProfile } = require('../services/memoryService');
const { getNearbyDoctors } = require('../services/doctorService');
const { MASTER_PROMPT, STRICT_MEDICAL_PROMPT } = require('../utils/promptTemplate');
const { detectIntent } = require('../services/intentService');

// Default to local answers so the project keeps responding even when API quotas
// are exhausted. Set LOCAL_ANSWERS_ONLY=false to re-enable external AI formatting.
const LOCAL_ANSWERS_ONLY = process.env.LOCAL_ANSWERS_ONLY !== 'false';

const normalizeSex = (text) => {
  const lower = text.toLowerCase();
  if (/\b(male|mawl|malw|mle|man|boy|m)\b/.test(lower)) return 'male';
  if (/\b(female|woman|girl|f)\b/.test(lower)) return 'female';
  if (/\b(other|nonbinary|non-binary|transgender|prefer not)\b/.test(lower)) return 'other';
  return '';
};

/**
 * Deeply sanitizes an object to ensure that known string fields 
 * do not contain objects (which causes "[object Object]" rendering).
 */
const sanitizeResponse = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (['understanding', 'text', 'doctor', 'risk', 'disclaimer', 'type', 'specialist', 'intent'].includes(key)) {
      if (value && typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeResponse(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

const extractAge = (text) => {
  const ageMatch = text.match(/\b(?:age\s*)?(\d{1,3})\s*(?:years?\s*old|yrs?\s*old|yo|y\/o|years?|yrs?)?\b/i);
  if (!ageMatch) return null;
  const age = parseInt(ageMatch[1]);
  return (age > 0 && age < 120) ? age : null;
};

const updatePatientProfileFromMessage = (session, message) => {
  const age = extractAge(message);
  if (age) session.patientProfile.age = age;

  const sex = normalizeSex(message);
  if (sex) session.patientProfile.sex = sex;
};

const profileQuestion = (missingFields) => {
  if (missingFields.includes('age') && missingFields.includes('sex')) {
    return "To provide a safer assessment, could you please tell me your age and sex?";
  } else if (missingFields.includes('age')) {
    return "Thank you. And what is your age?";
  } else {
    return "Got it. And what is your sex?";
  }
};

const formatRetrievedContext = (retrievedContext = []) => {
  if (!Array.isArray(retrievedContext)) return '';
  return retrievedContext
    .filter(Boolean)
    .slice(0, 10)
    .map((c, index) => {
      const text = typeof c === 'string'
        ? c
        : typeof c.text === 'string'
          ? c.text
          : c.text && typeof c.text === 'object'
            ? JSON.stringify(c.text)
            : '';
      if (!text) return '';
      const source = c.source ? `source=${c.source}` : 'source=unknown';
      const type = c.type ? `type=${c.type}` : 'type=note';
      const cleanText = text.replace(/\s+/g, ' ').trim();
      return `[${index + 1}] ${source}; ${type}; text: ${cleanText}`;
    })
    .filter(Boolean)
    .join('\n')
    .trim();
};

const isUnavailableAiResponse = (response) => {
  if (!response || typeof response !== 'object') return true;
  return response.confidence === 0
    || /encountered an error processing your request/i.test(String(response.understanding || response.text || ''));
};

const generalLocalResponse = (message) => {
  const lower = String(message || '').toLowerCase();
  if (/\b(hi|hello|hey|namaste|salaam)\b/.test(lower)) {
    return "Hello! I'm MeAssist AI. Tell me your health question or symptoms, and I can search the local medical knowledge base for general guidance.";
  }
  return "I can help with general medical questions and symptom triage. Please describe the symptom, condition, duration, severity, age, and sex if relevant.";
};

const noContextResponse = (query, fallbackRisk = 'Low') => ({
  intent: 'medical',
  type: 'chat',
  text: 'No specific medical data was found in the local knowledge base for this query. Please consult a qualified healthcare provider for personalised advice.',
  understanding: `No specific medical data was found in the local knowledge base for: "${query}".`,
  causes: [],
  risk: fallbackRisk,
  recommendations: [
    'If symptoms are severe, sudden, worsening, or associated with breathing trouble, chest pain, confusion, fainting, heavy bleeding, or weakness, seek urgent medical care.',
    'For non-urgent concerns, contact a qualified healthcare provider for personalised advice.'
  ],
  doctor: 'General Physician',
  confidence: 0.55,
  emergency: false,
  sources: [],
  fallback: true
});

const sentenceCase = (text) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
};

const uniqueShortList = (items = [], limit = 5) => {
  const seen = new Set();
  return items
    .map((item) => sentenceCase(item).replace(/\.$/, ''))
    .filter((item) => item.length >= 3 && item.length <= 180)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

const splitClinicalList = (text) => String(text || '')
  .replace(/\([^)]*\)/g, '')
  .split(/[,;]|\band\b/i)
  .map((item) => item.replace(/^[-•\s]+/, '').trim())
  .filter(Boolean);

const extractLabeledSections = (context = []) => {
  const sections = { symptoms: [], problems: [], causes: [], recommendations: [] };
  const labels = 'File\\s+\\d+:|Problem|Symptoms|Possible causes|Possible cause|Causes|Cause|Solution\\/Remedy|Solution|Remedy|Red flags|Suggested specialist';
  const labelRegex = new RegExp(`(Problem|Symptoms|Possible causes|Possible cause|Causes|Cause|Solution\\/Remedy|Solution|Remedy):\\s*([\\s\\S]*?)(?=\\s+(?:${labels}):|$)`, 'gi');

  context.forEach((entry) => {
    const text = String(entry?.text || '').replace(/\s+/g, ' ').trim();
    if (!text) return;

    let matched = false;
    for (const match of text.matchAll(labelRegex)) {
      matched = true;
      const label = match[1].toLowerCase();
      const value = match[2].replace(/^File\s+\d+:\s*/i, '').trim();
      if (!value) continue;
      if (label === 'symptoms') sections.symptoms.push(...splitClinicalList(value));
      if (label === 'problem') sections.problems.push(value);
      if (label.includes('cause')) sections.causes.push(...splitClinicalList(value));
      if (label.includes('solution') || label.includes('remedy')) sections.recommendations.push(...splitClinicalList(value));
    }

    if (!matched) {
      if (entry?.type === 'symptoms') sections.symptoms.push(...splitClinicalList(text));
      if (entry?.type === 'causes') sections.causes.push(...splitClinicalList(text));
      if (entry?.type === 'recommendations') sections.recommendations.push(...splitClinicalList(text));
    }
  });

  return {
    symptoms: uniqueShortList(sections.symptoms, 6),
    problems: uniqueShortList(sections.problems, 4),
    causes: uniqueShortList(sections.causes, 6),
    recommendations: uniqueShortList(sections.recommendations, 5)
  };
};

const buildLocalFollowUpQuestions = (message, structuredData = {}) => {
  const lower = String(message || '').toLowerCase();
  const questions = [];
  const hasDuration = Boolean(structuredData.duration) || /\b(since|for|today|yesterday|days?|weeks?|hours?|months?)\b/i.test(lower);
  const hasSeverity = Boolean(structuredData.severity) || /\b(mild|moderate|severe|worst|unbearable|improving|worse|worsening)\b/i.test(lower);

  if (!hasDuration) {
    questions.push('How long have you had these symptoms?');
  }

  if (!hasSeverity) {
    if (/\b(breath|breathless|breathing|cough|chest|pneumonia|lung)\b/i.test(lower)) {
      questions.push('Is the breathing problem mild, moderate, or severe, and do you have chest pain, high fever, blue lips, or coughing blood?');
    } else if (/\b(fever|headache|head ache|migraine|temperature|chills)\b/i.test(lower)) {
      questions.push('Is the headache or fever mild, moderate, or severe, and do you have neck stiffness, confusion, vomiting, weakness, or vision changes?');
    } else {
      questions.push('Are the symptoms mild, moderate, or severe, and are they getting worse?');
    }
  }

  return questions.slice(0, 2);
};

const responseFromContext = (context = [], sources = [], fallbackRisk = 'Low', query = '', structuredData = {}) => {
  const lowerQuery = String(query).toLowerCase();
  const wantsSymptoms = /\b(symptom|symptoms|sign|signs)\b/.test(lowerQuery);
  const wantsTreatment = /\b(treat|treatment|surgery|shunt|manage|management)\b/.test(lowerQuery);
  const wantsCauses = /\b(cause|causes|why)\b/.test(lowerQuery);
  const preferredType = wantsSymptoms
    ? 'symptoms'
    : wantsTreatment
      ? 'recommendations'
      : wantsCauses
        ? 'causes'
        : '';
  const queryWords = new Set(String(query || '').toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));
  const respiratoryWords = /\b(breath|breathing|breathless|cough|chest|mucus|phlegm|fever|infection|smok|inhaler|pneumonia|copd|lung|lungs|active|exercise|pursed|lip)\b/i;
  const headacheFeverWords = /\b(fever|temperature|chills|headache|migraine|head|neck|stiff|hydration|rest|sinus|viral|meningitis)\b/i;
  const isRelevantToQuery = (entry) => {
    const text = String(entry?.text || '').toLowerCase();
    const entryCategory = String(entry?.category || '');
    return Array.from(queryWords).some((word) => text.includes(word))
      || (entryCategory && lowerQuery.includes(entryCategory.replace('_', ' ')));
  };
  const isRelevantPoint = (point) => {
    const text = String(point || '').toLowerCase();
    if (Array.from(queryWords).some((word) => text.includes(word))) return true;
    if (/\b(breath|cough|chest|pneumonia|copd|lung|smok|inhaler|infection)\b/.test(lowerQuery)) {
      return respiratoryWords.test(text);
    }
    if (/\b(fever|headache|head ache|migraine|temperature|chills)\b/.test(lowerQuery)) {
      return headacheFeverWords.test(text);
    }
    return true;
  };

  const relevantContext = context.filter(isRelevantToQuery);
  const usableContext = relevantContext.length > 0 ? relevantContext : context;
  const labeled = extractLabeledSections(usableContext);
  const localSymptoms = uniqueShortList(structuredData.symptoms || [], 6);
  const symptoms = localSymptoms.length > 0
    ? localSymptoms
    : uniqueShortList(labeled.symptoms.filter(isRelevantPoint), 6);

  let primaryEntries = preferredType
    ? usableContext.filter((entry) => entry?.type === preferredType)
    : usableContext;
  if (wantsSymptoms && /\b(adult|adults|older)\b/.test(lowerQuery)) {
    const adultEntries = primaryEntries.filter((entry) => /\b(adult|adults|older|acquired|normal pressure|nph)\b/i.test(entry?.text || ''));
    if (adultEntries.length > 0) primaryEntries = adultEntries;
  }
  const relevantProblems = labeled.problems.filter(isRelevantPoint);
  const primary = symptoms.length > 0
    ? `You reported ${symptoms.slice(0, 4).join(', ')}. The matched knowledge base information is related to ${relevantProblems.slice(0, 2).join(' or ') || 'these symptoms'}.`
    : 'Relevant medical information was found in the knowledge base for your symptoms.';
  const causeEntries = usableContext
    .filter((entry) => entry?.type === 'causes')
    .map((entry) => entry.text)
    .slice(0, 3);
  const recommendations = wantsSymptoms
    ? []
    : (labeled.recommendations.length > 0 ? labeled.recommendations.filter(isRelevantPoint) : usableContext
      .filter((entry) => entry?.type === 'recommendations' || /remedy|treat|drink|rest|avoid|seek|consult/i.test(entry?.text || ''))
      .map((entry) => entry.text)
      .slice(0, 3));

  return {
    intent: 'medical',
    type: 'chat',
    text: primary || 'Relevant medical information was found in the knowledge base.',
    understanding: primary || 'Relevant medical information was found in the knowledge base.',
    symptoms,
    causes: wantsCauses
      ? uniqueShortList(primaryEntries.map((entry) => entry.text), 4)
      : uniqueShortList([...labeled.causes.filter(isRelevantPoint), ...relevantProblems, ...causeEntries], 5),
    risk: fallbackRisk,
    recommendations: uniqueShortList(recommendations, 5),
    doctor: 'General Physician',
    confidence: 0.7,
    emergency: false,
    sources
  };
};

const handleChatQuery = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || 'guest';

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const session = await getSession(sessionId, userId);
    
    // Load profile from DB if not in session
    if (!session.patientProfile.age || !session.patientProfile.sex) {
      const dbProfile = await getHealthProfile(userId);
      if (dbProfile.age) session.patientProfile.age = dbProfile.age;
      if (dbProfile.sex) session.patientProfile.sex = dbProfile.sex;
    }
    
    // Determine the state
    const isIterativeFlow = session.remainingQuestions && session.remainingQuestions.length > 0;
    
    // Intent Detection
    const intent = (isIterativeFlow || session.pendingMedicalMessage || session.pendingFollowUp) 
      ? (detectIntent(message) === 'reset' ? 'reset' : 'medical') 
      : detectIntent(message);

    await addSessionMessage(sessionId, 'user', message);

    if (intent === 'reset') {
      session.pendingMedicalMessage = '';
      session.pendingFollowUp = null;
      session.remainingQuestions = [];
      session.answeredQuestions = [];
      session.currentQuestion = null;
      session.latestContext = {};
      session.patientProfile = { age: null, sex: '' };
      await saveSession(sessionId, session);
      
      const resetResponse = { intent: 'greeting', text: "No problem! I've cleared the previous session. How else can I help you today?" };
      await addSessionMessage(sessionId, 'ai', resetResponse);
      return res.json(sanitizeResponse(resetResponse));
    }

    if (intent === 'greeting' || intent === 'general' || intent === 'unclear') {
      const chatResponseText = LOCAL_ANSWERS_ONLY
        ? generalLocalResponse(message)
        : await generateChatText(message);
      const chatResponse = { intent, text: chatResponseText };
      await addSessionMessage(sessionId, 'ai', chatResponse);
      return res.json(sanitizeResponse(chatResponse));
    }

    if (intent === 'medical_general') {
      const { context, sources } = await retrieveContext(userId, message);
      let medicalGeneralResponse;

      if (!hasEnoughContext(context)) {
        if (LOCAL_ANSWERS_ONLY) {
          medicalGeneralResponse = noContextResponse(message, 'Low');
        } else {
          const fallbackText = await askGeminiFallback(message);
          medicalGeneralResponse = {
            ...noContextResponse(message, 'Low'),
            text: fallbackText,
            understanding: fallbackText,
            confidence: 0.75
          };
        }
      } else {
        if (LOCAL_ANSWERS_ONLY) {
          medicalGeneralResponse = responseFromContext(context, sources, 'Low', message, {});
        } else {
          const payload = {
            message,
            patientProfile: session.patientProfile || {},
            structuredData: {},
            retrievedData: formatRetrievedContext(context),
            answers: [],
            userHistory: ''
          };
          medicalGeneralResponse = await processMedicalQuery(JSON.stringify(payload), STRICT_MEDICAL_PROMPT);
          if (isUnavailableAiResponse(medicalGeneralResponse)) {
            medicalGeneralResponse = responseFromContext(context, sources, 'Low', message, {});
          }
        }
        medicalGeneralResponse.intent = 'medical';
        medicalGeneralResponse.sources = sources;
      }

      // Add nearby doctors if a specialist is identified
      const specialist = medicalGeneralResponse.doctor || medicalGeneralResponse.specialist || 'General Physician';
      medicalGeneralResponse.doctors = await getNearbyDoctors(specialist);

      await saveInteraction(userId, message, medicalGeneralResponse, medicalGeneralResponse);
      await addSessionMessage(sessionId, 'ai', medicalGeneralResponse);
      await saveSession(sessionId, session);
      return res.json(sanitizeResponse(medicalGeneralResponse));
    }

    // ─── MEDICAL FLOW ───
    updatePatientProfileFromMessage(session, message);
    
    // Save updated profile to DB if changed
    if (session.patientProfile.age || session.patientProfile.sex) {
      await saveHealthProfile(userId, session.patientProfile);
    }

    if (!session.pendingMedicalMessage && !isIterativeFlow) {
      session.pendingMedicalMessage = message;
    }

    // Step 1: Collect Missing Profile
    const missingProfile = [];
    if (!session.patientProfile.age) missingProfile.push('age');
    if (!session.patientProfile.sex) missingProfile.push('sex');

    if (!LOCAL_ANSWERS_ONLY && missingProfile.length > 0) {
      const followupResponse = { intent: 'followup', text: profileQuestion(missingProfile), neededFields: missingProfile };
      await addSessionMessage(sessionId, 'ai', followupResponse);
      await saveSession(sessionId, session);
      return res.json(sanitizeResponse(followupResponse));
    }

    // Step 2: Emergency Check
    const medicalMessage = session.pendingMedicalMessage || message;
    const structuredData = await extractStructuredData(medicalMessage);
    const safetyStatus = checkEmergency(medicalMessage, structuredData);
    if (safetyStatus.emergency) {
      const emergencyResponse = {
        intent: 'medical',
        type: 'emergency',
        text: safetyStatus.message,
        understanding: "⚠️ This appears to be a medical emergency.",
        risk: 'Critical',
        emergency: true
      };
      await addSessionMessage(sessionId, 'ai', emergencyResponse);
      session.pendingMedicalMessage = '';
      session.remainingQuestions = [];
      session.answeredQuestions = [];
      await saveSession(sessionId, session);
      return res.json(sanitizeResponse(emergencyResponse));
    }

    // Step 3: Iterative Questions
    if (isIterativeFlow) {
      const lastQ = session.currentQuestion;
      session.answeredQuestions.push({ question: lastQ, answer: message });
      
      if (session.remainingQuestions.length > 0) {
        const nextQ = session.remainingQuestions.shift();
        session.currentQuestion = nextQ;
        const followupResponse = { 
          intent: 'followup', 
          text: nextQ, 
          currentQuestion: nextQ 
        };
        await addSessionMessage(sessionId, 'ai', followupResponse);
        await saveSession(sessionId, session);
        return res.json(sanitizeResponse(followupResponse));
      }
    }

    if (LOCAL_ANSWERS_ONLY && !isIterativeFlow && !session.pendingFollowUp) {
      const localQuestions = buildLocalFollowUpQuestions(medicalMessage, structuredData);
      if (localQuestions.length > 0) {
        session.remainingQuestions = localQuestions;
        const firstQ = session.remainingQuestions.shift();
        session.currentQuestion = firstQ;
        session.pendingFollowUp = true;

        const followupResponse = {
          intent: 'followup',
          text: firstQ,
          currentQuestion: firstQ
        };
        await addSessionMessage(sessionId, 'ai', followupResponse);
        await saveSession(sessionId, session);
        return res.json(sanitizeResponse(followupResponse));
      }
    }

    // Step 4: Initial Trigger or AI Reasoning
    const { context, sources } = await retrieveContext(userId, session.pendingMedicalMessage || message);
    
    if (!LOCAL_ANSWERS_ONLY && !isIterativeFlow && !session.pendingFollowUp) {
      const history = await getRecentHistory(userId, 3);
      const payload = {
        message: session.pendingMedicalMessage || message,
        patientProfile: session.patientProfile,
        structuredData,
        retrievedData: formatRetrievedContext(context),
        userHistory: history.map(h => `User: ${h.message}\nAI: ${JSON.stringify(h.ai_response)}`).join('\n\n')
      };

      const aiResponse = await processMedicalQuery(JSON.stringify(payload), MASTER_PROMPT);
      
      if (aiResponse.type === 'followup' && aiResponse.questions?.length > 0) {
        session.remainingQuestions = aiResponse.questions;
        const firstQ = session.remainingQuestions.shift();
        session.currentQuestion = firstQ;
        session.pendingFollowUp = true;
        
        const followupResponse = { 
          intent: 'followup', 
          text: firstQ, 
          currentQuestion: firstQ 
        };
        await addSessionMessage(sessionId, 'ai', followupResponse);
        await saveSession(sessionId, session);
        return res.json(sanitizeResponse(followupResponse));
      }
    }

    // Step 5: Final Conclusion
    const history = await getRecentHistory(userId, 5);
    const payload = {
      message: session.pendingMedicalMessage || message,
      patientProfile: session.patientProfile,
      structuredData,
      retrievedData: formatRetrievedContext(context),
      answers: session.answeredQuestions,
      userHistory: history.map(h => h.message).join(' | ')
    };

    let aiResponse;
    if (!hasEnoughContext(context)) {
      if (LOCAL_ANSWERS_ONLY) {
        aiResponse = noContextResponse(session.pendingMedicalMessage || message, safetyStatus.risk || 'Low');
      } else {
        const fallbackText = await askGeminiFallback(session.pendingMedicalMessage || message);
        aiResponse = {
          ...noContextResponse(session.pendingMedicalMessage || message, safetyStatus.risk || 'Low'),
          text: fallbackText,
          understanding: fallbackText
        };
      }
    } else {
      if (LOCAL_ANSWERS_ONLY) {
        aiResponse = responseFromContext(context, sources, safetyStatus.risk || 'Low', session.pendingMedicalMessage || message, structuredData);
      } else {
        aiResponse = await processMedicalQuery(JSON.stringify(payload), STRICT_MEDICAL_PROMPT);
        if (isUnavailableAiResponse(aiResponse)) {
          aiResponse = responseFromContext(context, sources, safetyStatus.risk || 'Low', session.pendingMedicalMessage || message, structuredData);
        }
      }
      aiResponse.sources = sources;
      aiResponse.intent = 'medical';
    }

    // Add nearby doctors if a specialist is identified
    const specialist = aiResponse.doctor || aiResponse.specialist || 'General Physician';
    aiResponse.doctors = await getNearbyDoctors(specialist);

    await saveInteraction(userId, session.pendingMedicalMessage || message, aiResponse, aiResponse);
    await addSessionMessage(sessionId, 'ai', aiResponse);

    // Reset session
    session.pendingMedicalMessage = '';
    session.remainingQuestions = [];
    session.answeredQuestions = [];
    session.currentQuestion = null;
    session.pendingFollowUp = null;
    // session.patientProfile = { age: null, sex: '' }; // DO NOT RESET - Keep it for next session
    await saveSession(sessionId, session);

    return res.json(sanitizeResponse(aiResponse));

  } catch (error) {
    console.error('Chat Controller Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  handleChatQuery
};
