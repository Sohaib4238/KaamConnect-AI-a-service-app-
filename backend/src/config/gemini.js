import Groq from 'groq-sdk';
import 'dotenv/config';

console.log('[Groq] API Key loaded:', process.env.GROQ_API_KEY ? 'YES - ' + process.env.GROQ_API_KEY.substring(0, 8) + '...' : 'NO - KEY MISSING');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// We will use LLaMA 3.3 70B because it is exceptionally smart for intent routing
const MODEL_NAME = 'llama-3.3-70b-versatile';

async function askGroq(prompt, systemInstruction = null) {
  try {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.1,
      max_completion_tokens: 1024,
    });

    return { success: true, text: response.choices[0].message.content };
  } catch (error) {
    console.error('[Groq] Error:', error.message);
    return { success: false, error: error.message, text: null };
  }
}

async function askGroqJSON(prompt, systemInstruction = null) {
  try {
    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    // Groq's native JSON mode requires the word "JSON" to be in the prompt
    messages.push({ role: 'user', content: prompt + '\n\nRespond strictly in valid JSON format.' });

    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.1,
      max_completion_tokens: 1024,
      response_format: { type: 'json_object' } // This forces the output to be valid JSON
    });

    const jsonString = response.choices[0].message.content;
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    console.error('[Groq JSON] Error:', error.message);
    return { success: false, error: 'JSON parse failed or API error: ' + error.message };
  }
}

const responseCache = new Map();

async function askGroqCached(cacheKey, prompt, systemInstruction = null) {
  if (responseCache.has(cacheKey)) {
    console.log('[Groq] Cache hit:', cacheKey);
    return responseCache.get(cacheKey);
  }
  const result = await askGroqJSON(prompt, systemInstruction);
  if (result.success) {
    responseCache.set(cacheKey, result);
    setTimeout(() => responseCache.delete(cacheKey), 5 * 60 * 1000);
  }
  return result;
}

export { groq, askGroq as askGemini, askGroqJSON as askGeminiJSON, askGroqCached as askGeminiCached };