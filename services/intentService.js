/**
 * intentService.js
 * Deterministic intent classifier — runs BEFORE any RAG or AI call.
 * Returns: 'greeting' | 'medical' | 'medical_general' | 'general'
 */

const GREETINGS = new Set([
  'hello', 'hi', 'hey', 'hiya', 'howdy',
  'good morning', 'good afternoon', 'good evening', 'good night',
  'what\'s up', 'whats up', 'sup', 'yo',
  'namaste', 'salaam', 'helo', 'hii', 'hiiii',
]);

const MEDICAL_KEYWORDS = [
  // Symptoms
  'pain', 'ache', 'aching', 'hurts', 'hurt', 'sore',
  'fever', 'temperature', 'chills', 'sweating',
  'headache', 'migraine',
  'cough', 'coughing', 'cold', 'runny nose', 'sneezing',
  'dizziness', 'dizzy', 'vertigo', 'lightheaded',
  'nausea', 'vomiting', 'throwing up', 'vomit',
  'fatigue', 'tired', 'weakness', 'weak', 'exhausted',
  'rash', 'itching', 'swelling', 'inflammation',
  'bleeding', 'blood',
  'breathless', 'breathing', 'breath',
  'infection', 'infected',
  'symptom', 'symptoms', 'feeling', 'unwell', 'sick', 'ill',
  'stomach', 'abdomen', 'chest', 'throat', 'back',
  'burning', 'tingling', 'numbness', 'stiffness',
  'hypertension', 'pressure', 'sugar',
  'allergy', 'allergic', 'reaction',
  'wound', 'injury', 'broken', 'fracture', 'sprain',
  'discharge', 'cramps', 'constipation', 'diarrhea',
  'insomnia', 'sleep', 'anxiety', 'depression', 'stress',
  'weight loss', 'weight gain', 'appetite',
  // Specific conditions that describe ACTIVE symptoms (not general knowledge)
  'i have', 'i am feeling', 'i feel', 'suffering from', 'experiencing',
  'diagnosed with', 'my', 'started', 'since yesterday', 'since last',
  // Medical context words
  'medicine', 'medication', 'tablet',
  'prescription', 'treatment', 'diagnosis', 'test', 'scan',
  'dose', 'dosage', 'drug', 'pill', 'injection', 'vaccine',
  'surgery', 'operation', 'clinic', 'physician',
  'polio', 'asthma', 'malaria', 'dengue', 'typhoid', 'covid',
  'pneumonia', 'tuberculosis', 'tb', 'jaundice', 'anemia',
  'hydrocephalus', 'normal pressure hydrocephalus', 'nph',
  'ventriculoperitoneal shunt', 'shunt', 'fontanelle',
];

// Keywords that indicate the user is asking a GENERAL KNOWLEDGE question
// (e.g. "what is diabetes") → should route to Gemini, not RAG
const GENERAL_QUESTION_PATTERNS = [
  /^what is\b/i,
  /^what are\b/i,
  /^how does\b/i,
  /^explain\b/i,
  /^tell me about\b/i,
  /^define\b/i,
  /^what causes\b/i,
  /^symptoms of\b/i,
  /^signs of\b/i,
  /^treatment for\b/i,
  /^how is\b/i,
  /^what do you know about\b/i,
];

/**
 * Detects the intent of a user message.
 * @param {string} text - raw user message
 * @returns {'greeting' | 'medical' | 'medical_general' | 'general'}
 */
function detectIntent(text) {
  const normalized = text.toLowerCase().trim();

  // 1. Exact-match greeting check
  if (GREETINGS.has(normalized)) {
    return 'greeting';
  }

  // 2. Short-phrase greeting check (e.g. "hello there", "hi doc")
  const firstWord = normalized.split(/\s+/)[0];
  if (GREETINGS.has(firstWord) && normalized.split(/\s+/).length <= 3) {
    return 'greeting';
  }

  // 3. Gibberish / Unclear check
  const isGibberish = (t) => {
    if (t.length < 3 && !GREETINGS.has(t)) return true;
    if (t.length > 20 && !t.includes(' ')) return true; // Long string no spaces
    const vowels = t.match(/[aeiouy]/gi);
    if (!vowels && t.length > 4) return true; // No vowels in long string
    return false;
  };

  if (isGibberish(normalized)) {
    return 'unclear';
  }

  // 4. Cancel / Restart check
  const CANCEL_KEYWORDS = ['cancel', 'restart', 'reset', 'clear', 'stop', 'new chat', 'start over'];
  if (CANCEL_KEYWORDS.some(k => normalized === k || normalized === `exit ${k}`)) {
    return 'reset';
  }

  // 5. General knowledge question check.
  // Medical knowledge questions still need medical guardrails; they just should not
  // trigger the symptom-intake profile flow.
  const isGeneralQuestion = GENERAL_QUESTION_PATTERNS.some(pattern => pattern.test(normalized));
  if (isGeneralQuestion) {
    const asksAboutMedicalTopic = MEDICAL_KEYWORDS.some(kw => normalized.includes(kw));
    if (asksAboutMedicalTopic) {
      return 'medical_general';
    }
    return 'general';
  }

  // 6. Medical keyword scan — only for ACTIVE symptom reports
  const isMedical = MEDICAL_KEYWORDS.some(kw => normalized.includes(kw));
  if (isMedical) {
    return 'medical';
  }

  // 7. Numeric answer check (e.g. "two", "2", "tow" typo)
  if (/^\d+$/.test(normalized) || /\b(one|two|three|four|five|tow)\b/.test(normalized)) {
    return 'medical'; // Likely an answer to a medical question
  }

  // 8. Default → general conversation
  return 'general';
}

module.exports = { detectIntent };
