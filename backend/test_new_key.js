const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testKey() {
  console.log('Testing Key:', apiKey.substring(0, 8) + '...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello, are you working?');
    const text = result.response.text();
    console.log('SUCCESS! Gemini response:', text);
    process.exit(0);
  } catch (err) {
    console.error('FAILED! Error:', err.message);
    process.exit(1);
  }
}

testKey();
