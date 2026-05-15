import { db } from '../config/firebase.js';
import { REMINDERS } from '../config/firestore-schema.js';

/**
 * Execute pure code reminder scheduling.
 * 
 * @param {string} bookingId 
 * @param {string} scheduledIsoTime 
 * @param {string} serviceName 
 * @param {string} providerName 
 * @returns {Promise<Object>}
 */
export async function runFollowUpAgent(bookingId, scheduledIsoTime, serviceName, providerName) {
  // Generate short sequential or random identifier like REM-001
  const suffix = String(Math.floor(100 + Math.random() * 900));
  const reminderId = `REM-${suffix}`;

  // Calculate exactly 1 hour before the scheduled time
  const appointmentTime = new Date(scheduledIsoTime);
  const reminderTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000);

  // Format friendly display time for the console requirement
  const formattedSchedule = reminderTime.toISOString().slice(0, 16).replace('T', ' ');

  const reminderRecord = {
    reminder_id: reminderId,
    booking_id: bookingId,
    reminder_time: reminderTime.toISOString(),
    type: 'pre_appointment',
    status: 'scheduled',
    message: `Reminder: Your ${serviceName} appointment with ${providerName} is scheduled in 1 hour.`,
    created_at: new Date().toISOString()
  };

  try {
    await db.collection(REMINDERS).doc(reminderId).set(reminderRecord);
    console.log(`[DB WRITE] Firestore → Document created in '${REMINDERS}': ${reminderId} (scheduled: ${formattedSchedule})`);
  } catch (err) {
    console.error(`❌ [FollowUpAgent] Firestore write failed for ${reminderId}:`, err.message);
  }

  return {
    reminder: {
      reminderId,
      scheduledTime: reminderTime.toISOString(),
      displaySchedule: formattedSchedule,
      message: reminderRecord.message,
      status: 'scheduled',
    },
    dbWriteLog: `[DB WRITE] Firestore → Document created in '${REMINDERS}': ${reminderId} (scheduled: ${formattedSchedule})`,
  };
}

export default { runFollowUpAgent };
