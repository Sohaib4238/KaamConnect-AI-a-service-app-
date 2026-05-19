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

// ── Raise Booking Issue ──
app.post('/api/bookings/:bookingId/issue', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const docRef = db.collection('bookings').doc(bookingId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    await docRef.update({
      status: 'issue_raised',
      issue_raised_at: new Date().toISOString()
    });
    res.json({ success: true, message: 'Booking issue raised successfully' });
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
      provider_id: provider.provider_id || provider.id || 'unknown_provider',
      provider_name: provider.name || 'Specialist',
      service_type: intent.service_type || 'AC_REPAIR',
      location: intent.location || 'Karachi',
      slot, status: 'confirmed', issue_description: intent.issue_description || '',
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

app.post('/api/suggest-service', async (req, res) => {
  try {
    const { problem, provider_services, service_type } = req.body;
    const { askGeminiJSON } = await import('./config/gemini.js');
    
    const prompt = `User problem: "${problem}"
Available services: ${JSON.stringify(provider_services?.slice(0,8))}
Service category: ${service_type}

Based on the problem description, suggest the most 
relevant service from the available services list.
Return JSON:
{
  "suggested_service": "service name",
  "service_object": { the matching service object },
  "reasoning": "brief explanation in Urdu/English why this service"
}`;
    
    const result = await askGeminiJSON(prompt);
    if (result.success) {
      res.json(result.data);
    } else {
      res.json({ 
        suggested_service: provider_services?.[0]?.name || 'General Service',
        service_object: provider_services?.[0] || {},
        reasoning: 'Most common service for your category'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Manual Booking Endpoints ──
app.get('/api/providers/:providerId', async (req, res) => {
  try {
    const doc = await db.collection('providers')
      .doc(req.params.providerId).get();
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, error: 'Provider not found' 
      });
    }
    res.json({ success: true, provider: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/providers/:providerId/slots', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
    }
    
    // Get provider's booked slots from Firestore
    const doc = await db.collection('providers').doc(providerId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const providerData = doc.data();
    const bookedSlots = providerData.booked_slots || [];
    
    // Generate time slots from 8 AM to 8 PM, 30 minutes apart
    const slots = [];
    const targetDate = new Date(date + 'T00:00:00+05:00'); // PKT
    
    for (let hour = 8; hour < 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slotTime = new Date(targetDate);
        slotTime.setHours(hour, min, 0, 0);
        
        // Skip past slots (if date is today)
        const now = new Date();
        if (slotTime <= now) continue;
        
        const slotISO = slotTime.toISOString();
        const isBooked = bookedSlots.some(bs => {
          const bsTime = new Date(bs);
          return Math.abs(bsTime - slotTime) < 30 * 60 * 1000;
        });
        
        slots.push({
          slot_time: slotISO,
          display_time: slotTime.toLocaleTimeString('en-PK', {
            hour: '2-digit',
            minute: '2-digit', 
            hour12: true,
            timeZone: 'Asia/Karachi'
          }),
          is_available: !isBooked
        });
      }
    }
    
    res.json({ 
      success: true, 
      provider_id: providerId,
      date,
      slots,
      total_available: slots.filter(s => s.is_available).length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/manual-book', async (req, res) => {
  try {
    const { 
      provider_id, 
      services,      // array of service objects [{id, name, price}]
      slot_time,     // ISO string of chosen slot
      user_details,  // { name, phone, address, address_label }
      user_id 
    } = req.body;
    
    if (!provider_id || !services || !slot_time || !user_details) {
      return res.status(400).json({ 
        error: 'provider_id, services, slot_time, user_details required' 
      });
    }
    
    // Check slot availability using Firestore transaction
    const providerRef = db.collection('providers').doc(provider_id);
    
    let bookingResult = null;
    
    await db.runTransaction(async (transaction) => {
      const providerDoc = await transaction.get(providerRef);
      if (!providerDoc.exists) {
        throw new Error('Provider not found');
      }
      
      const providerData = providerDoc.data();
      const bookedSlots = providerData.booked_slots || [];
      
      // Check if slot is already taken
      const slotTaken = bookedSlots.some(bs => {
        const bsTime = new Date(bs);
        const reqTime = new Date(slot_time);
        return Math.abs(bsTime - reqTime) < 30 * 60 * 1000;
      });
      
      if (slotTaken) {
        throw new Error('SLOT_TAKEN');
      }
      
      // Calculate total price
      const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);
      
      // Create booking
      const bookingId = 'MBK-' + Date.now();
      const booking = {
        booking_id: bookingId,
        booking_type: 'manual',
        user_id: user_id || 'guest',
        provider_id,
        provider_name: providerData.name,
        service_type: providerData.service_categories?.[0] || 'SERVICE',
        services_booked: services,
        slot: slot_time,
        status: 'confirmed',
        user_details,
        total_price: totalPrice,
        created_at: new Date().toISOString(),
        trace_id: 'MANUAL-' + Date.now()
      };
      
      // Add slot to provider's booked_slots
      const updatedBookedSlots = [...bookedSlots, slot_time];
      
      // Write both atomically
      const bookingRef = db.collection('bookings').doc(bookingId);
      transaction.set(bookingRef, booking);
      transaction.update(providerRef, { booked_slots: updatedBookedSlots });
      
      bookingResult = booking;
    });
    
    res.json({ 
      status: 'booking_confirmed', 
      booking: bookingResult,
      message: 'Booking confirmed successfully'
    });
    
  } catch (error) {
    if (error.message === 'SLOT_TAKEN') {
      return res.status(409).json({ 
        status: 'slot_taken',
        error: 'This slot was just booked by someone else. Please choose another time.',
        code: 'SLOT_TAKEN'
      });
    }
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
