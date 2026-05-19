import { askGroqCached } from '../config/groq.js';
import { logStep } from '../utils/logger.js';

const ROMAN_URDU_DICT = {
  'bijli wala': 'ELECTRICIAN',
  'bijli': 'ELECTRICIAN',
  'naali': 'PLUMBER',
  'nalka': 'PLUMBER',
  'plumber': 'PLUMBER',
  'ac wala': 'AC_REPAIR',
  'ac masla': 'AC_REPAIR',
  'ac repair': 'AC_REPAIR',
  'ac technician': 'AC_REPAIR',
  'carpenter': 'CARPENTER',
  'bardha': 'CARPENTER',
  'painter': 'PAINTER',
  'rang': 'PAINTER',
  'tutor': 'TUTOR',
  'teacher': 'TUTOR',
  'ustad': 'TUTOR',
  'beautician': 'BEAUTICIAN',
  'makeup': 'BEAUTICIAN',
  'kal subah': 'TOMORROW_MORNING',
  'kal raat': 'TOMORROW_NIGHT',
  'aaj raat': 'TONIGHT',
  'sham ko': 'EVENING',
  'raat ko': 'NIGHT',
  'subah': 'TOMORROW_MORNING',
  'kal': 'TOMORROW',
  'abhi': 'URGENT',
  'fauran': 'URGENT',
  'aaj': 'TODAY'
};

const SYSTEM_INSTRUCTION = `You are an intent parser for a service booking app 
in Pakistan. Users speak in Urdu, Roman Urdu, English, or a mix. 
Extract service booking intent from user messages.

Service categories: AC_REPAIR, ELECTRICIAN, PLUMBER, CARPENTER, PAINTER, 
TUTOR, BEAUTICIAN, DRIVER, CLEANER, GARDENER

Always respond with this exact JSON structure:
{
  "service_type": "SERVICE_CATEGORY or null",
  "location": "extracted location string or null",
  "time_preference": "URGENT|TODAY|TODAY_EVENING|TONIGHT|TOMORROW_MORNING|TOMORROW|TOMORROW_EVENING|TOMORROW_NIGHT|THIS_WEEK|FLEXIBLE or null",
  "urgency": "high|medium|low",
  "price_sensitivity": true or false,
  "is_refinement": true or false,
  "refinement_type": "cheaper|closer|different_time|null",
  "issue_description": "brief description in English",
  "confidence": 0.0 to 1.0,
  "language_detected": "urdu|roman_urdu|english|mixed",
  "clarification_needed": null or "question to ask user if confidence < 0.70"
}

Time mapping guide:
- 'subah' / 'morning' → TOMORROW_MORNING (10 AM)
- 'dopahar' / 'afternoon' → TOMORROW (2 PM)  
- 'sham' / 'evening' → TOMORROW_EVENING (6 PM)
- 'raat' / 'night' → TOMORROW_NIGHT (8 PM)
- 'abhi' / 'fauran' → URGENT (next 2 hours)
- 'aaj' → TODAY
- 'kal' → TOMORROW
Combined: 'kal raat' → TOMORROW_NIGHT, 'aaj sham' → TODAY_EVENING`;

export async function parseIntent(userInput, sessionState = {}, traceId = 'default') {
  if (!userInput || typeof userInput !== 'string') {
    return { error: 'Invalid input message' };
  }
  const startTime = Date.now();

  // Pre-process Roman Urdu
  let processedInput = userInput.toLowerCase();
  for (const [roman, english] of Object.entries(ROMAN_URDU_DICT)) {
    processedInput = processedInput.replace(new RegExp(roman, 'gi'), english);
  }

  const prompt = `Parse this service request: "${userInput}"
Pre-processed: "${processedInput}"
Conversation Context: ${JSON.stringify(sessionState)}
Extract the intent and return JSON. If the user is asking for something cheaper or closer relative to a previous request, set is_refinement to true.`;

  const cacheKey = userInput.trim().toLowerCase().substring(0, 100);
  const result = await askGroqCached(cacheKey, prompt, SYSTEM_INSTRUCTION);
  console.log('[Intent Debug] Groq result:', JSON.stringify(result));

  const duration = Date.now() - startTime;

  if (!result.success) {
    logStep(traceId, 1, 'intent-parser',
      'User input: ' + userInput,
      'Groq call failed: ' + result.error,
      'Use fallback parsing',
      'Returning low-confidence result',
      duration
    ).catch(console.error);
    return {
      service_type: null, location: null,
      time_preference: null, urgency: 'medium',
      price_sensitivity: false,
      issue_description: userInput,
      confidence: 0.3,
      language_detected: 'unknown',
      clarification_needed: 'Aap ko kaunsi service chahiye aur kahan?',
      raw_input: userInput
    };
  }

  const intent = { ...result.data, raw_input: userInput };

  logStep(traceId, 1, 'intent-parser',
    'User input: ' + userInput,
    'Language: ' + intent.language_detected +
    ', Service: ' + intent.service_type +
    ', Location: ' + intent.location,
    intent.confidence >= 0.70
      ? 'Proceed to provider-ranker'
      : 'Ask clarification: ' + intent.clarification_needed,
    'Intent extracted with confidence ' + intent.confidence,
    duration
  ).catch(console.error);

  return intent;
}

export const runIntentAgent = parseIntent;

export default { parseIntent, runIntentAgent };
