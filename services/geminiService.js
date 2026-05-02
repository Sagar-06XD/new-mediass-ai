const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MASTER_PROMPT } = require('../utils/promptTemplate');

// Initialize Gemini. The API key is passed in or read from process.env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callGemini(query, systemPrompt = MASTER_PROMPT) {
  try {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.1
        }
    });

    // We can just append the query to the system prompt
    // Wait, let's format it cleanly. If query is a JSON string (from the updated flow),
    // we should just pass it as is, or prepend "User Input: ".
    // Let's keep it generic:
    const prompt = `${systemPrompt}\n\nUser Input: ${query}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON to ensure it's valid before returning
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    // Defensive check: Ensure string fields are actually strings to avoid [object Object]
    ['understanding', 'doctor', 'risk', 'disclaimer'].forEach(key => {
      if (parsed[key] && typeof parsed[key] === 'object') {
        parsed[key] = JSON.stringify(parsed[key]);
      }
    });

    return parsed;
  } catch (error) {
    console.error('Gemini Service Error:', error.message);
    throw new Error('Failed to generate response from Gemini');
  }
}

async function generateChatText(query) {
  try {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.7
        }
    });

    const prompt = `You are a helpful and polite medical AI assistant named MeAssist AI.
If the user greets you, greet them back and ask how you can help with their health.
If they ask a general question, answer it concisely and remind them you can help analyze symptoms.
Do not provide medical diagnoses for general conversation.

User: ${query}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini Chat Error:', error.message);
    return "I am MeAssist AI, your intelligent medical assistant. How can I help you today?";
  }
}

/**
 * askGeminiFallback — used when RAG has no relevant context for a medical query.
 * Returns a plain-text response (not JSON) with safety guardrails.
 * This prevents hallucination from empty/irrelevant context.
 */
async function askGeminiFallback(question) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3 }
    });

    const prompt = `You are MeAssist AI, a cautious and helpful medical assistant.
The user has asked a health-related question, but no specific medical data was found in the knowledge base.

Provide a helpful, accurate, and safe general response based on well-established medical knowledge.
Be clear that this is general information only, not a personal diagnosis.
Always end with: "Please consult a qualified healthcare provider for personalised advice."

User question: ${question}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('[Gemini Fallback] Error:', error.message);
    return 'I was unable to find specific data for your query. Please consult a qualified healthcare provider for personalised advice.';
  }
}

async function callGeminiStructured(query, systemPrompt, retryCount = 0) {
  try {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { temperature: 0.1 }
    });

    const prompt = `${systemPrompt}\n\nUser Input: ${query}`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    if (error.message.includes('429') || error.message.includes('Quota exceeded')) {
      if (retryCount < 3) {
        console.log(`[Gemini Structured] Quota exceeded. Retrying in 30s... (Attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        return callGeminiStructured(query, systemPrompt, retryCount + 1);
      }
    }
    console.error('[Gemini Structured] Error:', error.message);
    throw error;
  }
}

module.exports = {
  callGemini,
  generateChatText,
  askGeminiFallback,
  callGeminiStructured
};
