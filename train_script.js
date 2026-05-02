const axios = require('axios');

const SYMPTOM_TRAINING_DATASET = `MediAssist AI – Advanced Symptom-Based Training Dataset (Extended)

---

INTRODUCTION
This dataset helps the AI assistant understand user symptoms, map them to possible conditions, estimate severity, and provide safe guidance.
The AI must NEVER give final diagnosis and must always include a disclaimer.

---

SYMPTOM: SORE THROAT
Description: Pain or irritation in throat

Symptoms:

* Pain while swallowing
* Dry throat
* Hoarseness
* Swelling

Possible Conditions:

* Viral infection
* Bacterial infection
* Cold

Severity:

* Low: mild irritation
* Medium: painful swallowing
* High: severe pain + fever

Advice:

* Warm liquids
* Salt water gargle
* Rest voice

---

SYMPTOM: RUNNY NOSE
Description: Excess nasal discharge

Symptoms:

* Sneezing
* Watery nose
* Nasal congestion

Possible Conditions:

* Common cold
* Allergy
* Sinus infection

Severity:

* Low: mild
* Medium: persistent
* High: breathing difficulty

Advice:

* Steam inhalation
* Hydration
* Avoid allergens

---

SYMPTOM: SHORTNESS OF BREATH
Description: Difficulty breathing

Symptoms:

* Rapid breathing
* Chest tightness
* Wheezing

Possible Conditions:

* Asthma
* Infection
* Heart issue

Severity:

* Medium: mild difficulty
* High: severe breathing issue

Advice:

* Seek immediate medical attention if severe

---

SYMPTOM: FATIGUE
Description: Extreme tiredness

Symptoms:

* Low energy
* Weakness
* Difficulty concentrating

Possible Conditions:

* Anemia
* Infection
* Stress

Severity:

* Low: occasional
* Medium: frequent
* High: persistent fatigue

Advice:

* Rest
* Balanced diet
* Hydration

---

SYMPTOM: SKIN RASH
Description: Red or itchy skin

Symptoms:

* Red patches
* Itching
* Swelling

Possible Conditions:

* Allergy
* Infection
* Skin disorder

Severity:

* Low: mild rash
* Medium: spreading rash
* High: severe swelling

Advice:

* Avoid irritants
* Use soothing lotion

---

SYMPTOM: BACK PAIN
Description: Pain in back

Symptoms:

* Stiffness
* Muscle ache
* Reduced movement

Possible Conditions:

* Muscle strain
* Poor posture
* Injury

Severity:

* Low: mild pain
* Medium: persistent
* High: severe pain

Advice:

* Rest
* Light stretching

---

SYMPTOM: JOINT PAIN
Description: Pain in joints

Symptoms:

* Swelling
* Stiffness
* Reduced mobility

Possible Conditions:

* Arthritis
* Injury
* Inflammation

Severity:

* Low: mild
* Medium: frequent
* High: severe pain

Advice:

* Rest
* Anti-inflammatory care

---

SYMPTOM: HIGH HEART RATE
Description: Increased heartbeat

Symptoms:

* Palpitations
* Anxiety
* Dizziness

Possible Conditions:

* Stress
* Heart condition
* Dehydration

Severity:

* Medium: occasional
* High: persistent

Advice:

* Rest
* Hydration
* Seek help if persistent

---

SYMPTOM COMBINATIONS (IMPORTANT)

Case 1: Fever + Cough + Fatigue
→ Possible: Flu / Viral Infection
→ Risk: Medium

Case 2: Chest Pain + Shortness of Breath
→ Possible: Heart issue
→ Risk: HIGH (Emergency)

Case 3: Headache + Vomiting + Sensitivity to light
→ Possible: Migraine
→ Risk: Medium

Case 4: Stomach Pain + Vomiting + Diarrhea
→ Possible: Food poisoning
→ Risk: Medium

Case 5: Dizziness + Weakness + Low energy
→ Possible: Dehydration / BP issue
→ Risk: Medium

---

ADVANCED RESPONSE RULES FOR AI

When symptoms are detected:

1. Identify symptoms clearly

2. Provide:

   * Possible conditions
   * Severity (Low / Medium / High)
   * Suggested action

3. If HIGH risk:
   → Always say: "Seek immediate medical attention"

4. If multiple symptoms:
   → Combine them for better prediction

5. If unclear:
   → Ask follow-up question

---

GENERAL CHAT RULES

* "hello", "hi" → normal response
* No symptoms → ask user to describe symptoms
* Do NOT give medical output for casual chat

---

MEDICAL DISCLAIMER

"This information is for guidance only and not a medical diagnosis. Please consult a healthcare professional."

---

END OF DATASET`;

async function train() {
  try {
    console.log('Sending training data...');
    const response = await axios.post('https://new-mediass-ai.onrender.com/api/train/text', { text: SYMPTOM_TRAINING_DATASET });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

module.exports = { SYMPTOM_TRAINING_DATASET, train };

if (require.main === module) {
  train();
}
