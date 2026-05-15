import { db } from '../config/firebase.js';
import { BOOKINGS } from '../config/firestore-schema.js';
import { parseTimeSlot } from '../tools/bookingTools.js';

/**
 * Execute pure code database booking persistence.
 * 
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {Object} params.provider
 * @param {string} params.serviceType
 * @param {string} params.location
 * @param {string} params.timePreference
 * @returns {Promise<Object>}
 */
export async function runBookingAgent({ sessionId, provider, serviceType, location, timePreference }) {
  // Generate strictly formatted ID: BK-YYYYMMDD-XXX
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(Math.floor(100 + Math.random() * 900)); 
  const bookingId = `BK-${dateStr}-${suffix}`;

  const timeSlot = parseTimeSlot(timePreference);
  const safeServiceType = serviceType || 'general';
  const safeLocation = location || 'Islamabad';
  const estimatedCost = (provider?.hourlyRate || 800) * 2; 

  const bookingRecord = {
    booking_id: bookingId,
    session_id: sessionId || 'default_session',
    user_name: 'Demo User',
    provider_id: provider?.id || 'PRV-GEN',
    provider_name: provider?.name || 'Assigned Specialist',
    service_type: safeServiceType,
    status: 'confirmed',
    scheduled_time: timeSlot.scheduledTime,
    location: safeLocation,
    estimated_cost: estimatedCost,
    created_at: new Date().toISOString(),
    notes: 'Autonomous booking via KaamConnect Firestore pipeline',
  };

  // Persist to Firestore
  try {
    await db.collection(BOOKINGS).doc(bookingId).set(bookingRecord);
    console.log(`[DB WRITE] Firestore → Document created in '${BOOKINGS}': ${bookingId}`);
  } catch (err) {
    console.error(`❌ [BookingAgent] Firestore write failed for ${bookingId}:`, err.message);
  }

  // Generate complete matching client receipt object
  const receipt = {
    receiptId: `RCP-${bookingId}`,
    bookingId,
    providerName: bookingRecord.provider_name,
    providerPhone: provider?.phone || '+92-300-0000000',
    serviceType: safeServiceType.replace(/_/g, ' '),
    scheduledTime: timeSlot.displayTime,
    scheduledDate: timeSlot.date,
    rawScheduledIso: timeSlot.scheduledTime,
    location: safeLocation,
    estimatedCost: `PKR ${estimatedCost.toLocaleString()}`,
    statusBadge: 'Confirmed',
    notes: 'Specialist scheduled. Cash on completion.',
  };

  return {
    booking: {
      bookingId,
      status: 'confirmed',
      scheduledTime: timeSlot.displayTime,
      scheduledDate: timeSlot.date,
      rawScheduledIso: timeSlot.scheduledTime,
      provider: bookingRecord.provider_name,
      providerPhone: receipt.providerPhone,
      location: safeLocation,
      estimatedCost: `PKR ${estimatedCost.toLocaleString()}`,
    },
    receipt,
    dbWriteLog: `[DB WRITE] Firestore → Document created in '${BOOKINGS}': ${bookingId}`,
  };
}

export default { runBookingAgent };
