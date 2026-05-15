import { db } from '../config/firebase.js';
import { TRACES } from '../config/firestore-schema.js';
import { WebSocketServer } from 'ws';

export const wsClients = new Set();

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('📡 [WebSocket] Mobile app connected for live agent trace streaming');
    wsClients.add(ws);
    
    ws.on('close', () => {
      wsClients.delete(ws);
    });
    
    ws.on('error', (err) => {
      console.error('⚠️ [WebSocket] Connection error:', err.message);
      wsClients.delete(ws);
    });
  });

  return wss;
}

/**
 * Structured logger that writes to console AND to Firestore traces collection.
 * This will be used by every agent skill.
 */
export async function logStep(traceId, step, skill, observation, inference, decision, action, durationMs) {
  const timestamp = new Date().toISOString();
  
  const stepObj = {
    traceId,
    step,
    skill,
    observation,
    inference,
    decision,
    action,
    durationMs,
    timestamp
  };

  // 1. Console Logging
  console.log(`\n📋 [Trace ${traceId} | Step ${step}] ${skill}`);
  console.log(`   👁️  Observed: ${observation}`);
  console.log(`   🧠  Inferred: ${inference}`);
  console.log(`   🎯  Decision: ${decision}`);
  console.log(`   ⚡  Action:   ${action} (${durationMs}ms)\n`);

  // 2. Firestore Write
  try {
    if (db) {
      // We can group steps under a trace document or store them flat.
      // Here we store them as a subcollection or just a flat document per step.
      // Easiest is flat documents with traceId and timestamp.
      await db.collection(TRACES).add(stepObj);
    }
  } catch (err) {
    console.error(`[TraceLogger] Failed to persist step to Firestore:`, err.message);
  }

  // 3. WebSocket Broadcast (if any clients connected)
  const wsPayload = JSON.stringify({
    type: 'agent_step',
    ...stepObj
  });

  for (const client of wsClients) {
    if (client.readyState === 1) { // OPEN
      client.send(wsPayload);
    }
  }
}

class AgentTraceLogger {
  constructor(traceId) {
    this.traceId = traceId;
    this.stepCount = 0;
    this.steps = [];
    this.startTime = Date.now();
  }

  async log(skill, observation, inference, decision, action, durationMs = 0) {
    this.stepCount++;
    const stepObj = {
      step: this.stepCount,
      skill,
      observation,
      inference,
      decision,
      action,
      durationMs,
      timestamp: new Date().toISOString()
    };
    this.steps.push(stepObj);
    
    return logStep(
      this.traceId,
      this.stepCount,
      skill,
      observation,
      inference,
      decision,
      action,
      durationMs
    );
  }

  getTrace() {
    return this.steps;
  }

  getTotalDuration() {
    return Date.now() - this.startTime;
  }
}

export { AgentTraceLogger };
