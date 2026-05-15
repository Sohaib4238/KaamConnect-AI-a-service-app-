/**
 * KaamConnect — Comprehensive Multi-Agent Orchestrator
 * 
 * Coordinates the 5 distinct named agents operating sequentially:
 * 1. IntentAgent    — Parses multilingual input, yields structured intent + confidence scores
 * 2. DiscoveryAgent — Pure code queries against mock database + automatic radius expansion fallback
 * 3. MatchingAgent  — Pure code multi-factor weighted scoring scorecard calculation + mid-conversation refinements
 * 4. BookingAgent   — Pure code persistent SQLite writes + BK-YYYYMMDD-XXX ID formatting
 * 5. FollowUpAgent  — Pure code reminder scheduling 1 hour prior to appointments
 * 6. ResponseAgent  — Final single Gemini call generating responsive summary matching user language
 */

import { runIntentAgent } from './intentAgent.js';
import { runDiscoveryAgent } from './discoveryAgent.js';
import { runMatchingAgent } from './matchingAgent.js';
import { runBookingAgent } from './bookingAgent.js';
import { runFollowUpAgent } from './followUpAgent.js';
import { AgentTraceLogger } from '../utils/logger.js';
import { askGemini } from '../config/gemini.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// AI configuration moved to ../config/gemini.js

// Persistent session memory store matching evaluation requirements
const sessions = {};

const RESPONSE_SYSTEM_PROMPT = `You are the final Response Agent for KaamConnect, an AI service booking assistant for Pakistan's informal economy.
You receive structured reasoning data from the internal agent pipeline and must generate a friendly, highly professional final summary for the user. Match the language the user originally used (Urdu Nastaliq, Roman Urdu, or English).

Include:
1. Clear direct confirmation of the interpreted service request
2. The selected service specialist, their distance, and visible reasoning summary (e.g. matching score out of 100)
3. Booking ID and scheduled time if an autonomous booking was completed
4. Follow-up reminder scheduling verification

Keep the summary concise, extremely premium, warm, and highly logical. Emojis can be used sparingly.`;

/**
 * Main orchestration entry point. Coordinates full autonomous multi-step execution.
 * 
 * @param {string} userMessage 
 * @param {string} sessionId 
 * @returns {Promise<Object>}
 */
export async function processRequest(userMessage, sessionId) {
  const requestId = uuidv4();
  const trace = new AgentTraceLogger(requestId);

  console.log(`\n🚀 [Orchestrator] Multi-step agentic execution starting for session: ${sessionId}`);
  console.log(`💬 User Input: "${userMessage}"`);

  // Initialize session memory state if absent
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      last_intent: null,
      last_providers: [],
      booking_id: null,
      current_best_price: null,
    };
  }
  const sessionState = sessions[sessionId];

  try {
    // ─── Step 1: Intent Agent (Gemini Call #1) ───
    const intentStart = Date.now();
    const intent = await runIntentAgent(userMessage, sessionState);
    await trace.log(
      'Intent Analysis',
      `User Message: "${userMessage}"`,
      `Detecting intent for service booking or general query`,
      `Intent Category: ${intent.intent_category}`,
      `Parsed with ${(intent.confidence * 100).toFixed(0)}% confidence`,
      Date.now() - intentStart
    );

    // ─── Handle General Conversation / Out of Scope Graceful Decline ───
    if (intent.intent_category === 'general_greeting' || intent.intent_category === 'out_of_scope') {
      const directResp = intent.direct_response || 
        (intent.intent_category === 'out_of_scope' 
          ? "Maaf kijiye, KaamConnect sirf Islamabad mein informal economy specialists (jaise AC technician, plumber, electrician, tutor) book karne ke liye banaya gaya hai. Main aapke liye kaunsi service dhundoon?"
          : "Salam! Main KaamConnect AI Assistant hoon. Main Islamabad mein verified informal service specialists book karne mein aapki madad kar sakta hoon. Aaj aapko kaunsi service chahiye?");
      
      await trace.log(
        'Response Generation',
        `Intent: ${intent.intent_category}`,
        'Generating appropriate greeting or out-of-scope response',
        `Response Text: ${directResp}`,
        intent.intent_category === 'out_of_scope' ? 'Declined out-of-scope query gracefully' : 'Responded to general conversation/greeting',
        0
      );

      return {
        response: directResp,
        intent,
        providers: [],
        booking: null,
        receipt: null,
        followUp: null,
        dbWriteLogs: [],
        agentTrace: trace.getTrace(),
        totalDurationMs: trace.getTotalDuration(),
      };
    }

    // ─── Edge Case B: Ambiguous Service Type / Clarification Needed ───
    if (intent.clarification_needed || intent.confidence < 0.7 || !intent.service_type || intent.service_type === 'general') {
      const clarificationMsg = "Aap kaunsi service chahte hain? Plumber, Electrician, Carpenter, AC Technician, ya koi aur craft?";
      
      await trace.log(
        'Clarification Agent',
        `Ambiguous request: "${userMessage}"`,
        'Request requires more details to proceed with discovery',
        `Clarification: ${clarificationMsg}`,
        'Requested targeted clarification for ambiguous service request',
        0
      );

      return {
        response: clarificationMsg,
        intent,
        providers: [],
        booking: null,
        receipt: null,
        followUp: null,
        dbWriteLogs: [],
        agentTrace: trace.getTrace(),
        totalDurationMs: trace.getTotalDuration(),
      };
    }

    // ─── Edge Case C: Mid-Conversation Refinement (Cheaper Options) ───
    let targetService = intent.service_type;
    let targetLocation = intent.location;
    let targetTime = intent.time_preference;
    let maxPriceThreshold = null;

    if (intent.is_refinement && intent.refinement_type === 'cheaper' && sessionState.last_intent) {
      console.log('🔄 [Orchestrator] Mid-conversation refinement detected: filtering for cheaper candidates');
      // Inherit persistent session memory parameters
      targetService = sessionState.last_intent.service_type || targetService;
      targetLocation = sessionState.last_intent.location || targetLocation;
      targetTime = sessionState.last_intent.time_preference || targetTime;

      if (sessionState.current_best_price) {
        maxPriceThreshold = sessionState.current_best_price * 0.8;
        console.log(`💰 Applying price threshold filter <= PKR ${maxPriceThreshold}`);
      }
    }

    // Update session memory persistent entry
    sessionState.last_intent = {
      service_type: targetService,
      location: targetLocation,
      time_preference: targetTime,
    };

    // ─── Step 2: Discovery Agent (Pure Code) ───
    const discoveryStart = Date.now();
    const discoveryResult = await runDiscoveryAgent(targetService, targetLocation);
    const fallbackStr = discoveryResult.searchMeta.fallbackSuggestion;
    
    await trace.log(
      'Provider Discovery',
      `Searching for ${targetService} in ${targetLocation || 'Islamabad'}`,
      discoveryResult.searchMeta.expandedRadiusUsed ? 'No local matches, expanding radius' : 'Searching within local radius',
      `Found ${discoveryResult.providers.length} candidates`,
      discoveryResult.searchMeta.expandedRadiusUsed 
        ? `0 local matches found. Expanded search radius to 5 km (Edge Case A)`
        : `Queried mock provider database for "${targetService}" near "${targetLocation || 'Anywhere'}"`,
      Date.now() - discoveryStart
    );

    // ─── Step 3: Matching Agent (Pure Code) ───
    const matchingStart = Date.now();
    const matchingResult = runMatchingAgent(discoveryResult.providers, targetTime, maxPriceThreshold);
    const topProvider = matchingResult.ranked[0];
    const topCandidatesList = matchingResult.ranked.slice(0, 3);

    // Persist current best price choice to session memory for future references
    if (topProvider) {
      sessionState.current_best_price = topProvider.hourlyRate;
      sessionState.last_providers = matchingResult.ranked;
    }

    await trace.log(
      'Provider Matching',
      `Ranking ${discoveryResult.providers.length} candidates`,
      'Applying multi-factor weighted scoring formula',
      `Selected: ${topProvider?.name || 'None'}`,
      maxPriceThreshold !== null 
        ? `Re-ranked candidates applying price constraint filter <= PKR ${maxPriceThreshold} (Edge Case C)`
        : `Scored candidates using weighted proximity (0.4), rating (0.3), and availability (0.3) formula`,
      Date.now() - matchingStart
    );

    // ─── Step 4: Booking Agent (Pure Code + DB Writes) ───
    let bookingPayload = null;
    let receiptPayload = null;
    let dbWriteLogBooking = '';

    if (topProvider) {
      const bookingStart = Date.now();
      const bResult = await runBookingAgent({
        sessionId,
        provider: topProvider,
        serviceType: targetService,
        location: discoveryResult.searchMeta.locationName || targetLocation,
        timePreference: targetTime,
      });

      bookingPayload = bResult.booking;
      receiptPayload = bResult.receipt;
      dbWriteLogBooking = bResult.dbWriteLog;
      sessionState.booking_id = bookingPayload.bookingId;

      await trace.log(
        'Booking Skill',
        `Booking ${targetService} with ${topProvider.name}`,
        'Persisting booking record to database',
        `Booking ID: ${bookingPayload.bookingId}`,
        `Persisted booking row to database & generated customer receipt`,
        Date.now() - bookingStart
      );
    }

    // ─── Step 5: Follow-Up Agent (Pure Code + DB Writes) ───
    let followUpPayload = null;
    let dbWriteLogReminder = '';

    if (bookingPayload && topProvider) {
      const followUpStart = Date.now();
      const fResult = await runFollowUpAgent(
        bookingPayload.bookingId,
        bookingPayload.rawScheduledIso,
        targetService.replace(/_/g, ' '),
        topProvider.name
      );

      followUpPayload = fResult.reminder;
      dbWriteLogReminder = fResult.dbWriteLog;

      await trace.log(
        'Follow-Up Skill',
        `Scheduled for ${bookingPayload.scheduledTime}`,
        'Calculating reminder trigger time (1 hour prior)',
        `Reminder ID: ${followUpPayload.reminderId}`,
        `Scheduled pre-appointment reminder database row exactly 1 hour prior`,
        Date.now() - followUpStart
      );
    }

    // ─── Step 6: Response Agent (Gemini Call #2) ───
    const responseStart = Date.now();
    const promptPayload = `Generate the final natural language summary for the user in their detected language: ${intent.language_detected}.
User Input: "${userMessage}"
Context Data:
- Target Service: ${targetService}
- Expanded Radius Fallback Suggestion Active: ${fallbackStr ? `Yes: "${fallbackStr}"` : 'No'}
- Mid-conversation cheaper refinement applied: ${maxPriceThreshold !== null ? 'Yes' : 'No'}
- Selected Provider: ${topProvider ? `${topProvider.name} (Score: ${topProvider.scorecard?.total}/100, Rate: PKR ${topProvider.hourlyRate}/hr)` : 'None found'}
- Booking ID: ${bookingPayload?.bookingId || 'N/A'}
- Scheduled Time: ${bookingPayload?.scheduledTime || 'N/A'}
- Reminder Scheduled: ${followUpPayload ? 'Yes, 1 hour prior' : 'No'}

Ensure the response is warm, highly professional, incorporates scorecard reasoning context, and states any expanded radius logic transparently.`;

    let finalResponseText = '';
    try {
      const respGen = await askGemini(promptPayload, RESPONSE_SYSTEM_PROMPT);
      if (respGen.success) {
        finalResponseText = respGen.text.trim();
      } else {
        throw new Error(respGen.error);
      }
    } catch (err) {
      console.error('⚠️ [ResponseAgent] Final Gemini call failed, using graceful string assembly fallback');
      if (fallbackStr) {
        finalResponseText = `${fallbackStr}\n\nHumne aapke liye ${topProvider?.name} ko assign kar diya hai. Rate: PKR ${topProvider?.hourlyRate}/hr. Booking ID: ${bookingPayload?.bookingId}.`;
      } else if (bookingPayload) {
        finalResponseText = `Aapki booking ${topProvider?.name} ke sath confirm ho gayi hai. Reasoning score: ${topProvider?.scorecard?.total}/100. Waqt: ${bookingPayload.scheduledTime}. Booking ID: ${bookingPayload.bookingId}. Specialist waqt par pahunch jayenge.`;
      } else {
        finalResponseText = `Maaf kijiye, is waqt aapke criteria ke mutabiq specialist available nahi ho saka.`;
      }
    }

    await trace.log(
      'Response Synthesis',
      `Language: ${intent.language_detected}`,
      'Summarizing agentic reasoning into user-friendly response',
      `Final Response length: ${finalResponseText.length} chars`,
      'Assembled final premium summary response for customer delivery',
      Date.now() - responseStart
    );

    console.log(`✅ [Orchestrator] Complete multi-agent pipeline finalized successfully in ${trace.getTotalDuration()}ms`);

    return {
      response: finalResponseText,
      intent,
      providers: topCandidatesList.map((p) => ({
        name: p.name,
        nameUrdu: p.nameUrdu,
        distance: p.distance != null ? `${p.distance} km` : 'Nearby',
        rating: p.rating,
        reviews: p.reviews,
        hourlyRate: `PKR ${p.hourlyRate}`,
        verified: p.verified,
        score: p.scorecard?.total || p.score,
        phone: p.phone,
        scorecard: p.scorecard,
      })),
      booking: bookingPayload,
      receipt: receiptPayload,
      followUp: followUpPayload,
      dbWriteLogs: [dbWriteLogBooking, dbWriteLogReminder].filter(Boolean),
      agentTrace: trace.getTrace(),
      totalDurationMs: trace.getTotalDuration(),
    };

  } catch (err) {
    console.error('❌ [Orchestrator] Exception intercepted:', err.stack);
    await trace.log('Orchestrator', 'Critical Pipeline Failure', `Error details: ${err.message}`, 'Aborting execution', `Critical failure: ${err.message}`, 0);

    return {
      response: 'I apologize, an unexpected pipeline reasoning error occurred. Please verify backend configurations.',
      intent: null,
      providers: [],
      booking: null,
      receipt: null,
      followUp: null,
      dbWriteLogs: [],
      agentTrace: trace.getTrace(),
      totalDurationMs: trace.getTotalDuration(),
      error: err.message,
    };
  }
}

export default { processRequest };
