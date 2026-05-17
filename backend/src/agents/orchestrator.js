import { parseIntent } from './intentAgent.js';
import { discoverProviders } from './discoveryAgent.js';
import { rankProviders } from './matchingAgent.js';
import { logStep } from '../utils/logger.js';
import { db } from '../config/firebase.js';
import { ANTIGRAVITY_SESSION, printAntigravityBanner } from '../config/antigravity-trace.js';

async function orchestrate(userInput, userId = 'anonymous') {
  const traceId = 'TR-' + Date.now();
  const sessionStart = Date.now();
  
  // Log Antigravity orchestration context
  printAntigravityBanner(traceId);
  console.log('📝 Input:', userInput);
  console.log('👤 User:', userId);
  console.log('🧠 Orchestration:', ANTIGRAVITY_SESSION.orchestration_mode);

  const result = {
    trace_id: traceId,
    user_input: userInput,
    steps_completed: [],
    final_status: 'in_progress'
  };

  try {
    // ── STEP 1: Intent Parsing ──
    console.log('Step 1/5: Intent Parser running...');
    const intent = await parseIntent(userInput, traceId);
    result.intent = intent;
    result.steps_completed.push('intent_parsing');

    if (!intent.service_type) {
      return {
        ...result,
        final_status: 'needs_clarification',
        clarification_question: intent.clarification_needed ||
          'Aap ko kaunsi service chahiye?',
        message: 'Could not determine service type from your request.'
      };
    }
    console.log('✅ Intent:', intent.service_type, 'at', intent.location);

    // ── STEP 2: Provider Discovery ──
    console.log('Step 2/5: Discovery Agent running...');
    const discoveryResult = await discoverProviders(intent, traceId);
    result.discovery = {
      total_found: discoveryResult.total_found,
      geocoded_address: discoveryResult.geocoded_address,
      user_location: discoveryResult.user_location
    };
    result.steps_completed.push('provider_discovery');
    console.log('✅ Found:', discoveryResult.total_found, 'providers');

    if (discoveryResult.total_found === 0) {
      return {
        ...result,
        final_status: 'no_providers_found',
        message: 'No providers found for ' + intent.service_type + 
          ' in ' + intent.location
      };
    }

    // ── STEP 3: Ranking ──
    console.log('Step 3/5: Ranking Agent running...');
    const rankingResult = await rankProviders(discoveryResult, intent, traceId);
    result.ranking = rankingResult;
    result.steps_completed.push('provider_ranking');
    console.log('✅ Top pick:', rankingResult.top_pick?.name, 
      'score:', rankingResult.top_pick?.score);

    // ── STEP 4: Booking Simulation ──
    console.log('Step 4/5: Booking Agent running...');
    const bookingId = 'BK-' + Date.now();
    const slot = getSlotFromTimePreference(intent.time_preference);
    
    const booking = {
      booking_id: bookingId,
      user_id: userId,
      provider_id: rankingResult.top_pick?.provider_id,
      provider_name: rankingResult.top_pick?.name,
      service_type: intent.service_type,
      slot: slot,
      status: 'confirmed',
      issue_description: intent.issue_description,
      created_at: new Date().toISOString(),
      trace_id: traceId,
      price_estimate: rankingResult.top_pick?.price_range
    };

    // Write to Firestore
    await db.collection('bookings').doc(bookingId).set(booking);
    result.booking = booking;
    result.steps_completed.push('booking_confirmed');
    console.log('✅ Booking confirmed:', bookingId, 'at', slot);

    logStep(
      traceId, 4, 'booking-agent',
      'Creating booking for ' + rankingResult.top_pick?.name,
      'Slot: ' + slot + ', Provider confirmed available',
      'Write booking to Firestore and confirm',
      'Booking ' + bookingId + ' created successfully',
      150
    ).catch(console.error);

    // ── STEP 5: Follow-up Scheduling ──
    console.log('Step 5/5: Follow-up Agent running...');
    const reminderTime = new Date(slot);
    reminderTime.setHours(reminderTime.getHours() - 1);
    
    const followUp = {
      booking_id: bookingId,
      reminder_scheduled: reminderTime.toISOString(),
      reminder_message: rankingResult.top_pick?.name + 
        ' is coming tomorrow at ' + 
        new Date(slot).toLocaleTimeString('en-PK', 
          { hour: '2-digit', minute: '2-digit' }),
      status_check_scheduled: new Date(
        new Date(slot).getTime() + 2 * 60 * 60 * 1000
      ).toISOString(),
      completion_check: 'scheduled'
    };

    result.follow_up = followUp;
    result.steps_completed.push('follow_up_scheduled');
    console.log('✅ Reminder scheduled for:', reminderTime.toISOString());

    logStep(
      traceId, 5, 'follow-up-agent',
      'Scheduling reminders for booking ' + bookingId,
      'Appointment at ' + slot + ', reminder 1hr before',
      'Schedule FCM reminder and completion check',
      'Reminder set for ' + reminderTime.toISOString(),
      80
    ).catch(console.error);

    // ── FINAL: Save complete trace ──
    const totalDuration = Date.now() - sessionStart;
    db.collection('traces').doc(traceId).set({
      ...result,
      final_status: 'booking_confirmed',
      total_duration_ms: totalDuration,
      completed_at: new Date().toISOString()
    }).catch(console.error);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ PIPELINE COMPLETE in', totalDuration + 'ms');
    console.log('═══════════════════════════════════════\n');

    return {
      ...result,
      final_status: 'booking_confirmed',
      total_duration_ms: totalDuration,
      summary: {
        message: 'Booking confirmed for ' + rankingResult.top_pick?.name,
        provider: rankingResult.top_pick?.name,
        slot: slot,
        booking_id: bookingId,
        reasoning: rankingResult.top_pick?.reasoning,
        alternatives: rankingResult.alternatives
      }
    };

  } catch (error) {
    console.error('❌ Orchestrator error:', error.message);
    result.final_status = 'error';
    result.error = error.message;
    return result;
  }
}

function getSlotFromTimePreference(timePreference) {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  
  switch(timePreference) {
    case 'URGENT':
      date.setHours(date.getHours() + 2);
      break;
    case 'TODAY':
      date.setHours(14, 0, 0, 0);
      break;
    case 'TODAY_EVENING':
      date.setHours(18, 0, 0, 0);
      break;
    case 'TONIGHT':
      date.setHours(20, 0, 0, 0);
      break;
    case 'TOMORROW_MORNING':
      date.setDate(date.getDate() + 1);
      date.setHours(10, 0, 0, 0);
      break;
    case 'TOMORROW':
      date.setDate(date.getDate() + 1);
      date.setHours(14, 0, 0, 0);
      break;
    case 'TOMORROW_EVENING':
      date.setDate(date.getDate() + 1);
      date.setHours(18, 0, 0, 0);
      break;
    case 'TOMORROW_NIGHT':
      date.setDate(date.getDate() + 1);
      date.setHours(20, 0, 0, 0);
      break;
    case 'THIS_WEEK':
      date.setDate(date.getDate() + 3);
      date.setHours(10, 0, 0, 0);
      break;
    case 'FLEXIBLE':
    default:
      date.setDate(date.getDate() + 1);
      date.setHours(10, 0, 0, 0);
      break;
  }
  return date.toISOString();
}

export { orchestrate, orchestrate as processRequest };
