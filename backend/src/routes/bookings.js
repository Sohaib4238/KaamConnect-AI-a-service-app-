import { Router } from 'express';
import { db } from '../config/firebase.js';
import { BOOKINGS, REMINDERS } from '../config/firestore-schema.js';

const router = Router();

/**
 * GET /api/bookings
 * List all bookings.
 */
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection(BOOKINGS).get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bookings/:id
 * Get a specific booking with its reminders.
 */
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection(BOOKINGS).doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    const booking = { id: doc.id, ...doc.data() };
    
    const remindersSnapshot = await db.collection(REMINDERS)
      .where('booking_id', '==', req.params.id)
      .get();
    const reminders = remindersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    res.json({ success: true, booking, reminders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bookings/session/:sessionId
 * Get all bookings for a specific session.
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const snapshot = await db.collection(BOOKINGS)
      .where('session_id', '==', req.params.sessionId)
      .get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/bookings/:id/status
 * Update a booking's status (e.g., cancel, complete).
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'in_progress'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const docRef = db.collection(BOOKINGS).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    await docRef.update({ status, updated_at: new Date().toISOString() });
    res.json({ success: true, message: `Booking ${req.params.id} status updated to: ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
