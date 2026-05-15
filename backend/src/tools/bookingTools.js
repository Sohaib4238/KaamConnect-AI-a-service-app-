/**
 * KaamConnect — Booking & Scheduling Tools
 * 
 * Pure code functions for creating bookings, generating receipts,
 * and managing scheduling. No LLM calls needed.
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase.js';
import { BOOKINGS, REMINDERS } from '../config/firestore-schema.js';

/**
 * Generate a human-readable booking ID.
 * Format: BK-YYYYMMDD-XXX
 */
function generateBookingId() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BK-${dateStr}-${suffix}`;
}

/**
 * Parse a time preference string into an actual scheduled datetime.
 * Handles: "tomorrow morning", "kal subah", "today evening", "aaj shaam", etc.
 * 
 * @param {string} timePreference - Natural language time
 * @returns {{ scheduledTime: string, displayTime: string, date: string }}
 */
export function parseTimeSlot(timePreference) {
  const now = new Date();
  const scheduled = new Date(now);

  const pref = (timePreference || '').toLowerCase();

  // Determine date
  if (pref.includes('kal') || pref.includes('tomorrow')) {
    scheduled.setDate(scheduled.getDate() + 1);
  } else if (pref.includes('parson') || pref.includes('day after')) {
    scheduled.setDate(scheduled.getDate() + 2);
  }
  // else: today

  // Determine time slot
  if (pref.includes('subah') || pref.includes('morning')) {
    scheduled.setHours(10, 0, 0, 0);
  } else if (pref.includes('dopahar') || pref.includes('afternoon')) {
    scheduled.setHours(14, 0, 0, 0);
  } else if (pref.includes('shaam') || pref.includes('evening')) {
    scheduled.setHours(17, 0, 0, 0);
  } else if (pref.includes('raat') || pref.includes('night')) {
    scheduled.setHours(20, 0, 0, 0);
  } else {
    // Default: next available slot (2 hours from now, rounded up)
    const nextHour = now.getHours() + 2;
    if (nextHour >= 20) {
      // Too late today, schedule for tomorrow morning
      scheduled.setDate(scheduled.getDate() + 1);
      scheduled.setHours(10, 0, 0, 0);
    } else {
      scheduled.setHours(nextHour, 0, 0, 0);
    }
  }

  // Format for Pakistan timezone (PKT = UTC+5)
  const offset = 5 * 60; // Pakistan is UTC+5
  const pktTime = new Date(scheduled.getTime() + (offset - scheduled.getTimezoneOffset()) * 60000);

  const displayTime = pktTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const date = pktTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    scheduledTime: scheduled.toISOString(),
    displayTime,
    date,
  };
}

/**
 * Create a complete booking with receipt and reminders.
 * 
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {Object} params.provider - Selected provider
 * @param {string} params.serviceType
 * @param {string} params.location
 * @param {string} params.timePreference
 * @param {string} [params.userName]
 * @returns {{ booking: Object, receipt: Object, reminders: Array }}
 */
export async function processBooking({ sessionId, provider, serviceType, location, timePreference, userName }) {
  const bookingId = generateBookingId();
  const timeSlot = parseTimeSlot(timePreference);

  const estimatedHours = 2;
  const estimatedCost = (provider?.hourlyRate || 500) * estimatedHours;

  const safeServiceType = serviceType || 'general';
  const safeLocation = location || 'Islamabad';

  const bookingData = {
    booking_id: bookingId,
    session_id: sessionId,
    user_name: userName || 'Demo User',
    provider_id: provider?.id || 'PROV-GEN',
    provider_name: provider?.name || 'Assigned Specialist',
    service_type: safeServiceType,
    status: 'confirmed',
    scheduled_time: timeSlot.scheduledTime,
    location: safeLocation,
    estimated_cost: estimatedCost,
    created_at: new Date().toISOString(),
    notes: `Booked via KaamConnect AI Assistant`,
  };

  await db.collection(BOOKINGS).doc(bookingId).set(bookingData);

  const reminderTime = new Date(new Date(timeSlot.scheduledTime).getTime() - 60 * 60 * 1000);
  const reminderId = `REM-${uuidv4().slice(0, 8)}`;

  const reminderData = {
    reminder_id: reminderId,
    booking_id: bookingId,
    reminder_time: reminderTime.toISOString(),
    type: 'pre_appointment',
    status: 'scheduled',
    message: `Reminder: Your ${safeServiceType.replace(/_/g, ' ')} appointment with ${bookingData.provider_name} is in 1 hour at ${timeSlot.displayTime}.`,
    created_at: new Date().toISOString(),
  };

  await db.collection(REMINDERS).doc(reminderId).set(reminderData);

  const receipt = {
    receiptId: `RCP-${bookingId}`,
    bookingId,
    provider: {
      name: bookingData.provider_name,
      nameUrdu: provider?.nameUrdu || '',
      phone: provider?.phone || '0300-0000000',
      rating: provider?.rating || 4.5,
      verified: provider?.verified ?? true,
    },
    service: safeServiceType.replace(/_/g, ' '),
    scheduledTime: timeSlot.displayTime,
    scheduledDate: timeSlot.date,
    location: safeLocation,
    estimatedCost: `PKR ${estimatedCost.toLocaleString()}`,
    status: 'Confirmed ✓',
    notes: 'Provider will arrive at the scheduled time. Please ensure access to the service area.',
  };

  return {
    booking: {
      bookingId,
      status: 'confirmed',
      scheduledTime: timeSlot.displayTime,
      scheduledDate: timeSlot.date,
      provider: bookingData.provider_name,
      providerPhone: receipt.provider.phone,
      location: safeLocation,
      estimatedCost: `PKR ${estimatedCost.toLocaleString()}`,
    },
    receipt,
    reminders: [{
      type: 'pre_appointment',
      time: reminderTime.toISOString(),
      message: reminderData.message,
      status: 'scheduled',
    }],
  };
}

/**
 * Get all bookings for a session.
 */
export async function getSessionBookings(sessionId) {
  const snapshot = await db.collection(BOOKINGS)
    .where('session_id', '==', sessionId)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default { processBooking, parseTimeSlot, getSessionBookings };
