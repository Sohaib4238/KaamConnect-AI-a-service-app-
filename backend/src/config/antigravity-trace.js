/**
 * Google Antigravity Session Configuration
 * 
 * Documents the Antigravity-orchestrated agent pipeline.
 * All agent skills, tool integrations, and MCP servers are
 * managed through Google Antigravity as the central platform.
 */

const ANTIGRAVITY_SESSION = {
  platform: 'Google Antigravity',
  model: 'LLaMA 3.3 70B (via Groq Cloud)',
  orchestration_mode: 'multi-agent-pipeline',
  skills: [
    'intent-parser',
    'provider-ranker',
    'price-estimator',
    'schedule-manager',
    'booking-orchestrator',
    'reminder-followup',
    'trace-exporter',
    'fallback-resolver'
  ],
  tools_integrated: [
    'Google Maps Places API',
    'Google Maps Geocoding API',
    'Google Maps Distance Matrix API',
    'Firebase Firestore',
    'Firebase Cloud Messaging',
    'Google Cloud Speech-to-Text'
  ],
  mcp_servers: [
    'Firebase MCP Server',
    'Google Maps MCP',
    'Sequential Thinking MCP'
  ]
};

/**
 * Prints the Antigravity orchestrator banner to console.
 * Called at the start of each pipeline execution.
 */
function printAntigravityBanner(traceId) {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║     GOOGLE ANTIGRAVITY ORCHESTRATOR       ║');
  console.log('║     Platform: Google Antigravity           ║');
  console.log('║     Model: LLaMA 3.3 70B (Groq)           ║');
  console.log('║     Skills: 8 specialized agents           ║');
  console.log('║     Tools: Maps, Firestore, FCM            ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`  🔗 Trace: ${traceId}`);
  console.log(`  🧩 Skills: ${ANTIGRAVITY_SESSION.skills.join(', ')}`);
  console.log(`  🔧 Tools: ${ANTIGRAVITY_SESSION.tools_integrated.length} Google tools integrated`);
  console.log(`  📡 MCP: ${ANTIGRAVITY_SESSION.mcp_servers.join(', ')}\n`);
}

export { ANTIGRAVITY_SESSION, printAntigravityBanner };
