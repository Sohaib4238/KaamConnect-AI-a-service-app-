/**
 * KaamConnect — Express Server Entry Point
 * 
 * AI Service Orchestrator for Informal Economy
 * Built with Google Antigravity for the Google Hackathon 2026
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import { initDatabase } from './data/database.js';
import { db } from './config/firebase.js';
import chatRoutes from './routes/chat.js';
import bookingsRoutes from './routes/bookings.js';
import providersRoutes from './routes/providers.js';
// import { getTracesByRequest } from './data/database.js';
import { setupWebSocketServer } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Ensure Google Application Credentials are set for Vertex AI
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(__dirname, '../service-account.json');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.url.includes('/health')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// ── Initialize Database ──
// SQLite initialization removed in favor of Firestore
// initDatabase();

// ── API Routes ──
app.use('/api/chat', chatRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/providers', providersRoutes);

// ── Agent Trace Route ──
app.get('/api/traces/:requestId', async (req, res) => {
  try {
    const { db } = await import('./config/firebase.js');
    const snapshot = await db.collection('traces')
      .where('requestId', '==', req.params.requestId)
      .orderBy('step', 'asc')
      .get();
    
    const traces = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, count: traces.length, traces });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verification route for Vertex AI Intent Agent
app.post('/api/test-intent', async (req, res) => {
  try {
    const { parseIntent } = await import('./agents/intentAgent.js');
    const { message } = req.body;
    console.log(`[TEST-INTENT] Received: "${message}"`);
    if (!message) return res.status(400).json({ error: 'message field required' });
    // parseIntent(userInput, sessionState, traceId)
    const result = await parseIntent(message, {}, 'test-trace-' + Date.now());
    res.json({ success: true, intent: result });
  } catch (error) {
    console.error('[TEST-INTENT] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Health Check ──
app.get('/health', async (req, res) => {
  let firestoreStatus = 'error';
  try {
    if (db) {
      await db.collection('providers').limit(1).get();
      firestoreStatus = 'connected';
    }
  } catch (error) {
    console.error('Firestore health check failed:', error);
  }

  res.json({
    status: 'ok',
    firestore: firestoreStatus,
    service: 'KaamConnect API',
    version: '1.0.0',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    timestamp: new Date().toISOString(),
  });
});

// ── Root Route ──
app.get('/', (req, res) => {
  res.json({
    name: 'KaamConnect — AI Service Orchestrator',
    description: 'Agentic AI system for informal economy service booking in Islamabad',
    version: '1.0.0',
    endpoints: {
      'POST /api/chat': 'Process a service request (main endpoint)',
      'GET /api/providers': 'List all service providers',
      'GET /api/bookings': 'List all bookings',
      'GET /api/traces/:requestId': 'Get agent trace for a request',
      'GET /health': 'Health check',
    },
    hackathon: 'Google Hackathon 2026',
    platform: 'Built with Google Antigravity',
  });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ── Start Server ──
const server = app.listen(PORT, HOST, () => {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  🚀 KaamConnect API Server`);
  console.log(`  📡 Running on http://${HOST}:${PORT}`);
  console.log(`  🤖 Model: Gemini 1.5 Flash (Vertex AI)`);
  console.log(`  🔑 Vertex AI: ✅ Connected`);
  console.log(`  💾 Database: Firestore ✅`);
  console.log(`${'═'.repeat(50)}\n`);
});

// Initialize live WebSocket streaming server attached to HTTP server
setupWebSocketServer(server);

export default app;
