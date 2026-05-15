/**
 * KaamConnect — Chat API Route
 * 
 * POST /api/chat — Main endpoint for processing service requests.
 * GET  /api/chat/history/:sessionId — Get chat history for a session.
 */

import { Router } from 'express';
import { processRequest } from '../agents/orchestrator.js';
import { db } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/chat
 * 
 * Process a natural language service request.
 * 
 * Body:
 *   - message: string (required) — User's message in any language
 *   - session_id: string (optional) — Session ID for multi-turn conversations
 * 
 * Returns: Full response with intent, providers, booking, trace
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const { message, session_id } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
        details: 'Please provide a non-empty message string.',
      });
    }

    // Create or reuse session
    const sessionId = session_id || `sess_${uuidv4().slice(0, 12)}`;
    
    // Create or reuse session in Firestore
    await db.collection('sessions').doc(sessionId).set({
      last_active: new Date().toISOString()
    }, { merge: true });

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📩 New request from session: ${sessionId}`);
    console.log(`💬 Message: "${message.trim()}"`);
    console.log(`${'═'.repeat(60)}`);

    // Process through the agent pipeline
    const result = await processRequest(message.trim(), sessionId);

    // Return structured response
    res.json({
      success: true,
      sessionId,
      ...result,
      meta: {
        processedAt: new Date().toISOString(),
        totalDurationMs: Date.now() - startTime,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      },
    });
  } catch (error) {
    console.error('❌ [ChatRoute] Unhandled error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
