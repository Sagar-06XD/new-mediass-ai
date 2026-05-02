const Groq = require('groq-sdk');
const { MASTER_PROMPT } = require('../utils/promptTemplate');

let groqClient = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  return groqClient;
}

async function callGroq(query, systemPrompt = MASTER_PROMPT) {
  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const responseText = chatCompletion.choices[0].message.content;
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Groq Service Error:', error.message);
    throw new Error('Failed to generate response from Groq');
  }
}

module.exports = {
  callGroq
};
