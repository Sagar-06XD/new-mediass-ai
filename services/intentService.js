/**
 * intentService.js
 * Deterministic intent classifier — runs BEFORE any RAG or AI call.
 * Returns: 'greeting' | 'medical' | 'general'
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
  'diabetes', 'hypertension', 'pressure', 'sugar',
  'allergy', 'allergic', 'reaction',
  'wound', 'injury', 'broken', 'fracture', 'sprain',
  'discharge', 'cramps', 'constipation', 'diarrhea',
  'insomnia', 'sleep', 'anxiety', 'depression', 'stress',
  'weight loss', 'weight gain', 'appetite',
  // Medical context words
  'doctor', 'hospital', 'medicine', 'medication', 'tablet',
  'prescription', 'treatment', 'diagnosis', 'test', 'scan',
  'dose', 'dosage', 'drug', 'pill', 'injection', 'vaccine',
  'surgery', 'operation', 'clinic', 'physician',
];

/**
 * Detects the intent of a user message.
 * @param {string} text - raw user message
 * @returns {'greeting' | 'medical' | 'general'}
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

  // 3. Medical keyword scan
  const isMedical = MEDICAL_KEYWORDS.some(kw => normalized.includes(kw));
  if (isMedical) {
    return 'medical';
  }

  // 4. Default → general conversation
  return 'general';
}

module.exports = { detectIntent };
