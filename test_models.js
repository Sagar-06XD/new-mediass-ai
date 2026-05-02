const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  console.log('Testing key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  try {
    const result = await model.generateContent('hi');
    console.log('gemini-1.5-flash works!');
  } catch (e) {
    console.log('gemini-1.5-flash failed:', e.message);
  }
}
list();
