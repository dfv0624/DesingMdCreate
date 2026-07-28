import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: 'Hello'
    });
    console.log(response.text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
