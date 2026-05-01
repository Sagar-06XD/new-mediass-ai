const { emergencyKeywords } = require('../utils/emergencyKeywords');

function checkEmergency(input, structuredData) {
  const lowercaseInput = input.toLowerCase();
  
  // 1. Keyword Matching (Deterministic)
  const isEmergencyKeyword = emergencyKeywords.some(keyword => lowercaseInput.includes(keyword));
  
  // 2. Structured Data Check (if extraction layer caught something critical)
  const isEmergencySeverity = structuredData.severity && structuredData.severity.toLowerCase() === 'high' 
    && (structuredData.type === 'acute/sharp' || structuredData.type === 'sudden');

  if (isEmergencyKeyword || isEmergencySeverity) {
    return {
      emergency: true,
      risk: "High",
      message: "⚠️ This may be a medical emergency. Seek immediate help."
    };
  }

  // 3. Rule-based Triage Scoring for non-emergencies
  let score = 0;

  // Severity scoring
  if (structuredData.severity) {
    const sev = structuredData.severity.toLowerCase();
    if (sev === 'high' || sev === 'severe') score += 2;
    else if (sev === 'moderate') score += 1;
  }

  // Duration scoring (simple heuristic: if it contains days/weeks/months/years it's long, else short)
  if (structuredData.duration) {
    const dur = structuredData.duration.toLowerCase();
    if (dur.includes('week') || dur.includes('month') || dur.includes('year') || dur.includes('days')) {
      score += 1;
    }
  }

  // Multiple symptoms scoring
  if (structuredData.symptoms && Array.isArray(structuredData.symptoms) && structuredData.symptoms.length > 1) {
    score += 2;
  }

  let riskLevel = "Low";
  if (score >= 5) {
    riskLevel = "High";
  } else if (score >= 3) {
    riskLevel = "Moderate";
  }

  return {
    emergency: false,
    risk: riskLevel
  };
}

module.exports = {
  checkEmergency
};
