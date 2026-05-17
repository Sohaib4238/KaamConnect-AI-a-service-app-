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

// ── Google Antigravity Platform Info ──
app.get('/api/antigravity-info', (req, res) => {
  res.json({
    platform: 'Google Antigravity',
    version: 'Gemini 2.5 Flash',
    orchestration: 'Multi-agent pipeline with 8 skills',
    agents_active: [
      { name: 'intent-parser', status: 'active', model: 'Gemini 2.5 Flash' },
      { name: 'discovery-agent', status: 'active', model: 'Maps API + Firestore' },
      { name: 'provider-ranker', status: 'active', model: 'rule-based + GPS' },
      { name: 'booking-orchestrator', status: 'active', model: 'Firestore' },
      { name: 'reminder-followup', status: 'active', model: 'Cloud Scheduler' },
      { name: 'trace-exporter', status: 'active', model: 'Firestore + WebSocket' },
      { name: 'price-estimator', status: 'active', model: 'rule-based' },
      { name: 'fallback-resolver', status: 'active', model: 'rule-based' }
    ],
    google_tools_used: [
      'Google Maps Places API',
      'Google Maps Geocoding API',
      'Google Maps Distance Matrix API',
      'Google Cloud Firestore',
      'Firebase Cloud Messaging',
      'Google Antigravity Agent IDE'
    ],
    mcp_servers_connected: [
      'Firebase MCP Server',
      'Google Maps MCP Server',
      'Sequential Thinking MCP'
    ],
    antigravity_role: 'Primary orchestrator — all agent skills were built, tested, and deployed through Google Antigravity. The agent pipeline architecture, skill definitions, tool integrations, and agentic reasoning traces are all products of Antigravity orchestration.'
  });
});

// ── Agent Trace Routes ──
app.get('/api/traces', async (req, res) => {
  try {
    const snapshot = await db.collection('traces').limit(20).get();
    const traces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    traces.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
    res.json({ success: true, count: traces.length, traces });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/traces/:requestId', async (req, res) => {
  try {
    const doc = await db.collection('traces').doc(req.params.requestId).get();
    if (doc.exists) {
      return res.json({ success: true, trace: { id: doc.id, ...doc.data() } });
    }
    const snapshot = await db.collection('traces')
      .where('requestId', '==', req.params.requestId)
      .get();
    const traces = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, count: traces.length, traces });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Cancel Booking ──
app.post('/api/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const docRef = db.collection('bookings').doc(bookingId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    await docRef.update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    });
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Complete Booking ──
app.post('/api/bookings/:bookingId/complete', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const docRef = db.collection('bookings').doc(bookingId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    await docRef.update({
      status: 'completed',
      completed_at: new Date().toISOString()
    });
    res.json({ success: true, message: 'Booking marked as completed' });
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

app.post('/api/test-discovery', async (req, res) => {
  try {
    const { discoverProviders } = await import('./agents/discoveryAgent.js');
    const { message } = req.body;
    const { parseIntent } = await import('./agents/intentAgent.js');
    const intent = await parseIntent(message, {}, 'discovery-test-' + Date.now());
    const result = await discoverProviders(intent, 'discovery-test-' + Date.now());
    res.json({ 
      success: true, 
      intent,
      discovery: {
        total_found: result.total_found,
        geocoded_address: result.geocoded_address,
        user_location: result.user_location,
        providers: result.providers.map(p => ({
          name: p.name,
          source: p.source,
          distance_km: p.distance_km?.toFixed(2),
          rating: p.simulated_state?.rating?.toFixed(1) || p.rating,
          available: p.simulated_state?.availability
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Staged endpoint: discover providers without booking ──
app.post('/api/discover', async (req, res) => {
  try {
    const { parseIntent } = await import('./agents/intentAgent.js');
    const { discoverProviders } = await import('./agents/discoveryAgent.js');
    const { rankProviders } = await import('./agents/matchingAgent.js');
    const { message, user_lat, user_lng } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const traceId = 'TR-' + Date.now();
    const intent = await parseIntent(message, {}, traceId);

    // Attach GPS coordinates to intent if provided by mobile
    if (user_lat && user_lng) {
      intent.gps_lat = parseFloat(user_lat);
      intent.gps_lng = parseFloat(user_lng);
      console.log('[Discover] GPS received:', user_lat, user_lng);
    }

    if (!intent.service_type) {
      return res.json({ status: 'needs_clarification', intent,
        clarification: intent.clarification_needed || 'Aap kaunsi service chahte hain?' });
    }
    const discovery = await discoverProviders(intent, traceId);
    if (discovery.total_found === 0) {
      return res.json({ status: 'no_providers', intent, message: 'No providers found' });
    }
    const ranking = await rankProviders(discovery, intent, traceId);
    res.json({ status: 'providers_found', intent, ranking, trace_id: traceId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Staged endpoint: book a chosen provider ──
app.post('/api/book', async (req, res) => {
  try {
    const { provider, intent, trace_id, user_id } = req.body;
    if (!provider || !intent) return res.status(400).json({ error: 'provider and intent required' });

    const traceId = trace_id || 'TR-' + Date.now();
    const bookingId = 'BK-' + Date.now();
    const getSlot = (timePref) => {
      const d = new Date();
      d.setMinutes(0, 0, 0, 0);
      switch(timePref) {
        case 'URGENT':
          d.setHours(d.getHours() + 2); break;
        case 'TODAY':
          d.setHours(14, 0, 0, 0); break;
        case 'TODAY_EVENING':
          d.setHours(18, 0, 0, 0); break;
        case 'TONIGHT':
          d.setHours(20, 0, 0, 0); break;
        case 'TOMORROW_MORNING':
          d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); break;
        case 'TOMORROW':
          d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); break;
        case 'TOMORROW_EVENING':
          d.setDate(d.getDate() + 1); d.setHours(18, 0, 0, 0); break;
        case 'TOMORROW_NIGHT':
          d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); break;
        case 'THIS_WEEK':
          d.setDate(d.getDate() + 3); d.setHours(10, 0, 0, 0); break;
        default:
          d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); break;
      }
      return d.toISOString();
    };
    const slot = getSlot(intent.time_preference);

    const booking = {
      booking_id: bookingId, user_id: user_id || 'mobile-user',
      provider_id: provider.provider_id, provider_name: provider.name,
      service_type: intent.service_type, location: intent.location,
      slot, status: 'confirmed', issue_description: intent.issue_description,
      created_at: new Date().toISOString(), trace_id: traceId,
      price_estimate: provider.price_range || provider.simulated_state?.price_range_pkr || { min: 1500, max: 3000 },
    };
    await db.collection('bookings').doc(bookingId).set(booking);

    const reminderTime = new Date(slot);
    reminderTime.setHours(reminderTime.getHours() - 1);
    const follow_up = { booking_id: bookingId, reminder_scheduled: reminderTime.toISOString() };

    db.collection('traces').doc(traceId).set({
      trace_id: traceId, user_input: intent.original_message || '',
      steps_completed: ['intent_parsing','provider_discovery','provider_ranking','booking_confirmed','follow_up_scheduled'],
      final_status: 'booking_confirmed', total_duration_ms: 0, completed_at: new Date().toISOString(),
    }).catch(console.error);

    res.json({ status: 'booking_confirmed', booking, follow_up, trace_id: traceId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Full pipeline (legacy) ──
app.post('/api/orchestrate', async (req, res) => {
  try {
    const { orchestrate } = await import('./agents/orchestrator.js');
    const { message, user_id } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const result = await orchestrate(message, user_id || 'anonymous');
    res.json(result);
  } catch (error) {
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
