const { processMedicalQuery } = require('./aiRouter');
const { EXTRACTION_PROMPT } = require('../utils/promptTemplate');

function extractLocalStructuredData(rawMessage) {
  const text = rawMessage.toLowerCase();
  const symptomPatterns = [
    ['fever', /\b(fever|feverish|temperature|temp|high temp)\b/],
    ['chills', /\b(chills|shivering)\b/],
    ['headache', /\b(headache|head ache|head pain|migraine|sinus headache)\b/],
    ['cough', /\b(cough|coughing)\b/],
    ['chesty cough', /\b(chesty cough|productive cough|cough with mucus|cough with phlegm)\b/],
    ['cold', /\b(cold|flu|runny nose|blocked nose|stuffy nose|sneezing|congestion)\b/],
    ['sore throat', /\b(sore throat|throat pain|painful throat)\b/],
    ['neck stiffness', /\b(neck stiffness|stiff neck)\b/],
    ['rash', /\b(rash|skin rash|hives|red spots)\b/],
    ['itching', /\b(itch|itching|itchy)\b/],
    ['burning urine', /\b(burning urine|burning when urinating|painful urination|urine burning)\b/],
    ['stomach pain', /\b(stomach pain|abdominal pain|belly pain|abdomen pain|gas pain|cramps?)\b/],
    ['vomiting', /\b(vomit|vomiting|throwing up)\b/],
    ['diarrhea', /\b(diarrhea|loose motion|loose motions|watery stool)\b/],
    ['chest pain', /\b(chest pain|chest pressure|heart pain)\b/],
    ['shortness of breath', /\b(shortness of breath|breathing problem|difficulty breathing|breathlessness|breathless|can't breathe|cannot breathe)\b/],
    ['chest infections', /\b(chest infection|chest infections|lung infection|lung infections|respiratory infection|respiratory infections)\b/],
    ['dizziness', /\b(dizzy|dizziness|vertigo|lightheaded|light headed)\b/],
    ['weakness', /\b(weakness|weak|tired|fatigue|fatigued)\b/],
    ['nausea', /\b(nausea|nauseous|feeling sick)\b/]
  ];

  const symptoms = symptomPatterns
    .filter(([symptom, pattern]) => {
      const escapedSymptom = symptom.replace(/\s+/g, '\\s+');
      const negated = new RegExp(`\\b(no|without|denies)\\s+(?:${escapedSymptom})\\b`).test(text);
      return pattern.test(text) && !negated;
    })
    .map(([symptom]) => symptom);

  const durationMatch = text.match(/\b(\d+\s*(?:day|days|week|weeks|hour|hours|month|months))\b/);
  const tempMatch = text.match(/\b(?:10[0-9]|9[5-9])(?:\.\d+)?\s*(?:f|°f|fahrenheit)?\b/);
  const highSeverity = /severe|worst|unbearable|can't breathe|cannot breathe|faint|confusion|blue lips/.test(text);

  return {
    symptoms: Array.from(new Set(symptoms)),
    duration: durationMatch?.[1] || '',
    severity: highSeverity ? 'high' : '',
    type: '',
    location: '',
    temperature: tempMatch?.[0] || '',
    additionalNotes: rawMessage
  };
}

async function extractStructuredData(rawMessage) {
  try {
    console.log('[Extraction Service] Extracting structured data from user message...');
    const localData = extractLocalStructuredData(rawMessage);

    if (process.env.LOCAL_ANSWERS_ONLY !== 'false') {
      console.log('[Extraction Service] Local-only mode enabled, using local extraction.');
      return localData;
    }
    
    // We reuse the AI Router but pass the EXTRACTION_PROMPT as the system prompt
    // The aiRouter returns parsed JSON
    const structuredData = await processMedicalQuery(rawMessage, EXTRACTION_PROMPT);
    if (structuredData.confidence === 0 || structuredData.understanding === 'We encountered an error processing your request.') {
      console.log('[Extraction Service] AI extraction unavailable, using local extraction.');
      return localData;
    }
    
    console.log('[Extraction Service] Successfully extracted data:', structuredData);
    return {
      ...structuredData,
      symptoms: Array.from(new Set([...(structuredData.symptoms || []), ...localData.symptoms])),
      duration: structuredData.duration || localData.duration,
      temperature: structuredData.temperature || localData.temperature,
      additionalNotes: structuredData.additionalNotes || localData.additionalNotes
    };
  } catch (error) {
    console.error('[Extraction Service] Failed to extract data:', error.message);
    return extractLocalStructuredData(rawMessage);
  }
}

module.exports = {
  extractStructuredData
};
