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
    return JSON.parse(cleanJson);
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

    const prompt = `You are a helpful and polite medical AI assistant named Mediass AI.
If the user greets you, greet them back and ask how you can help with their health.
If they ask a general question, answer it concisely and remind them you can help analyze symptoms.
Do not provide medical diagnoses for general conversation.

User: ${query}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini Chat Error:', error.message);
    return "I am Mediass AI, your intelligent medical assistant. How can I help you today?";
  }
}

module.exports = {
  callGemini,
  generateChatText
};
