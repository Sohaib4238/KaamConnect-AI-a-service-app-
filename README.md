# 🇵🇰 KaamConnect (کام کنیکٹ)
### AI-Powered Service Orchestrator for the Informal Economy
> *Core Agentic AI built, optimized, and orchestrated via Google Antigravity.*

---

## 🚀 Challenge Overview & Vision
In developing economies, millions of informal service providers—**plumbers, electricians, AC technicians, beauticians, and tutors**—operate entirely through unorganized channels like WhatsApp messages, phone calls, and informal word-of-mouth referrals. 

This results in:
*   **Inefficient service matching** and lost wages for workers.
*   **Lack of automation** and difficulty booking reliable help.
*   **Poor user experience** for clients struggling to find nearby, trusted, and available providers.

**KaamConnect** is a cutting-edge **Agentic AI System** that automates the end-to-end lifecycle of a service request. From parsing a natural language query in **English, Urdu, or Roman Urdu** to finding, ranking, booking, scheduling, and executing follow-ups—all simulated in real-time with an intuitive, stunning mobile application.

---

## 📐 Overall Solution Design & Architecture

KaamConnect uses a decoupled **Client-Server Architecture** designed to facilitate real-time streaming telemetry of multi-agent execution steps.

```
┌────────────────────────────────────────────────────────┐
│                   Expo Mobile Client                   │
│   ┌──────────────────┐          ┌──────────────────┐   │
│   │   UX/UI Screens  │◄────────►│ LeafletWebView   │   │
│   └────────┬─────────┘          └──────────────────┘   │
└────────────┼───────────────────────────────────────────┘
             │                               
             │ HTTP REST (Auth, Coordinates, Manual Bookings)
             │ WebSocket (Real-time AI Trace Streaming)
             ▼                               
┌────────────────────────────────────────────────────────┐
│                   Express API Server                   │
│   ┌────────────────────────────────────────────────┐   │
│   │           Antigravity Orchestrator             │   │
│   │  (Manages multi-agent sequential pipeline)     │   │
│   └──────┬───────────────┬──────────────────┬──────┘   │
└──────────┼───────────────┼──────────────────┼──────────┘
           │               │                  │
           ▼               ▼                  ▼
┌──────────────────┐┌──────────────┐┌──────────────────┐
│  Groq Cloud LLM  ││  Google Maps ││Firebase Firestore│
│ (Llama 3.3 Auth) ││  (Geocode)   ││   (Live State)   │
└──────────────────┘└──────────────┘└──────────────────┘
```

### Overall System Flow:
1.  **Input & Intent:** The user types or speaks a request in Urdu or Roman Urdu into the **Chat Screen**. This is transmitted via WebSockets to the server.
2.  **Orchestration Loop:** The central **Antigravity Orchestration Engine** starts a step-by-step reasoning cycle. As each agent operates, detailed process execution logs (trace metadata) are streamed back to the client over WebSockets in real time.
3.  **Visual Feedback:** The client renders these execution traces in a dedicated **Agent Trace Screen**, showing the user exactly which agent is making decisions, calling APIs, or validating results.
4.  **Transaction & Mapping:** Once matched, a location pin is dropped onto an interactive mapping display, and transaction schemas are persisted in Firestore, updating the client's booking tab instantly.

---

## 🤖 Developed AI Agents

KaamConnect features **5 highly specialized, autonomous agents** that handle distinct components of the service request lifecycle. Each agent processes inputs, executes specialized rules or LLM calls, and outputs structured contracts:

### 1. Intent Parser Agent (`intentAgent.js`)
*   **Role:** Extracts the core details of the request from unstructured user prompts in English, Urdu, or Roman Urdu.
*   **Input:** Conversation string (e.g. *"AC thik krwane k liye Clifton me kal dopahar koi chahiye"*).
*   **Output:** Structured JSON schema highlighting:
    -   `service_type` (e.g., `AC_REPAIR`, `ELECTRICIAN`, `PLUMBER`)
    -   `location` (e.g., `Clifton, Karachi`)
    -   `time_preference` (e.g., `Tomorrow Afternoon`)
    -   `language_detected` & `confidence` parameters.

### 2. Discovery Agent (`discoveryAgent.js`)
*   **Role:** Performs spatial searches and geocodes requested locations to find physical matches in the local vicinity.
*   **Input:** Structured location string and service type from the Intent Agent.
*   **Output:** Geo-coordinates (`lat`, `lng`) of the target location, paired with a collection of available matching service providers within a 5km radius.

### 3. Matching & Ranking Agent (`matchingAgent.js`)
*   **Role:** Scores and orders discovered providers based on a multi-criteria decision algorithm.
*   **Input:** List of nearby candidate providers, geocoded user coordinates, and specific time constraints.
*   **Output:** Calculated distance matrix results, ratings, and time-slot compatibility checks, culminating in a `top_pick` selection complete with human-readable rationale (e.g., *"Selected Siddiqui AC Services because they are closest [0.8km] and have a 4.9-star rating"*).

### 4. Booking Agent (`bookingAgent.js`)
*   **Role:** Handles transactional generation and mock state persistence.
*   **Input:** Selected provider details, user profile, time-slot preferences, and target area names.
*   **Output:** Generates a randomized transaction tracking code (e.g., `BK-1716301295`), computes a mock price estimate, formats local date slots, and updates the shared database state.

### 5. Follow-Up Agent (`followUpAgent.js`)
*   **Role:** Sets background notification reminders and feedback loops.
*   **Input:** Finalized booking contract details.
*   **Output:** Schedules background reminder jobs (exactly 1 hour prior to appointment) and post-completion checklist audits.

---

## 🛠️ Integrations: Mock vs. Real APIs

To ensure the project remains highly resilient, scalable, and stable for a live hackathon demonstration, we carefully separated integrations into **Real APIs** (for production-grade external systems) and **Mock/Simulation Modules** (to ensure flawless, zero-downtime visual demonstrations).

### Real Production Integrations & APIs:
*   **Google Maps Geocoding API:** Real API integration via `@googlemaps/google-maps-services-js`. Converts text-based addresses and colloquial sector names entered by users into accurate latitude and longitude coordinate matrices.
*   **Groq Cloud LLM API (LLaMA 3.3 70B):** Production LLM backend engine. Executes zero-shot classification prompts for intent translation and generates natural conversational reasoning scripts under 300ms.
*   **Expo Native Location Services:** Direct physical device GPS API integration via `expo-location`. Safely prompts users for foreground permissions to grab immediate device coordinate frames.
*   **Firebase Firestore Database:** Production cloud database system. Tracks active user accounts, provider directories, and updates in real-time.
*   **WebSockets API:** Full-duplex connection pipeline enabling streaming AI agent telemetry step-by-step from the node backend straight to the mobile client layout.

### Mock & Simulated Systems (Optimized for Showcase):
*   **OpenStreetMap (OSM) Tiles / Leaflet.js Mapping:** Bypasses Google's native MapView to guarantee flawless 100% tile rendering across physical devices without SDK key billing dependency. Uses keyless OSM WebViews for rendering.
*   **FCM Reminder & Push Engine Simulation:** Schedules local mock background notifications representing 1-hour reminders and follow-up worker confirmation prompts.
*   **Mock Local Provider Dataset:** A tailored database representing verified service professionals across Karachi's major sectors (Clifton, DHA, Gulshan-e-Iqbal, Tariq Road) complete with simulated pricing ranges, reviews, and dynamic schedule tables.

---

## 📝 End-to-End Agent Trace Logs (Example Execution - Karachi)

When a user submits: **`"Mujhe kal subah Clifton Block 5 mein AC technician chahiye"`**

### Step 1: Intent Extraction (Urdu/Roman Urdu -> Structured Data)
```json
{
  "service_type": "AC_REPAIR",
  "location": "Clifton Block 5, Karachi",
  "time_preference": "Tomorrow Morning",
  "language_detected": "Roman Urdu",
  "confidence": 0.99
}
```

### Step 2: Provider Discovery
```json
{
  "geocoded_location": { "lat": 24.8138, "lng": 67.0336 },
  "total_providers_found": 3,
  "candidates": [
    { "name": "Siddiqui AC & Cooling", "lat": 24.8190, "lng": 67.0392, "rating": 4.9 },
    { "name": "Karachi Repair Works", "lat": 24.8050, "lng": 67.0250, "rating": 4.3 }
  ]
}
```

### Step 3: Ranking & Decision Reasoning
```json
{
  "top_pick": {
    "provider_id": "PROV-912",
    "name": "Siddiqui AC & Cooling",
    "distance_km": 0.8,
    "score": 9.8,
    "price_range": "PKR 1,500 - 2,500",
    "reasoning": "Siddiqui AC & Cooling is the top matching provider, located just 0.8 km away in Clifton. They hold a 4.9-star customer rating and have active slot availability for tomorrow morning."
  }
}
```

### Step 4: Booking Simulation (Action & Database State Change)
A real document is written to the **Firestore Database**:
```json
{
  "booking_id": "BK-288301284",
  "provider_id": "PROV-912",
  "status": "confirmed",
  "scheduled_slot": "2026-05-21T10:00:00.000Z",
  "price_estimate": "PKR 1,800"
}
```

### Step 5: Follow-Up Automation
```json
{
  "reminder_time": "2026-05-21T09:00:00.000Z",
  "reminder_message": "KaamConnect: Your technician from Siddiqui AC & Cooling is scheduled to arrive in 1 hour (10:00 AM).",
  "status_check_time": "2026-05-21T12:00:00.000Z"
}
```

---

## 📡 The Role of Google Antigravity

**Google Antigravity** is central to both the development, execution, and tracing of the system logic.

### 1. Development & Engineering Orchestration
Throughout the development lifecycle, **Google Antigravity** acted as the agentic pair programmer to:
*   **Design & Implement the Multi-Agent Framework:** Set up clean separation of concerns across the 5 specialized agents.
*   **Implement WebView-Based Map Rendering:** When native Google Maps SDK struggled to load tiles due to build-time environment constraints and device key restrictions, Antigravity designed a high-performance **Leaflet.js + OpenStreetMap (OSM)** WebView overlay. This guarantees that map tiles render instantly on 100% of physical and simulated Android devices without requiring credit cards or Google Cloud billing accounts.
*   **Non-Blocking Geocoding Fallbacks:** Optimized manual and GPS location updates by pairing low-accuracy cached cellular lookups (returning in <0.5 seconds) with async reverse-geocoding calls. The map moves instantly, and the address resolves smoothly in the background.

### 2. Live Agent Tracing (`antigravity-trace.js`)
All orchestration processes are wrapped and monitored through an Antigravity tracing context. The backend outputs strict tracing logs allowing real-time auditability:

```javascript
// Sample Output from the Antigravity Orchestrator
╔═══════════════════════════════════════════╗
║     GOOGLE ANTIGRAVITY ORCHESTRATOR       ║
║     Platform: Google Antigravity           ║
║     Model: LLaMA 3.3 70B (Groq)           ║
║     Skills: 8 specialized agents           ║
║     Tools: Maps, Firestore, FCM            ║
╚═══════════════════════════════════════════╝
  🔗 Trace: TR-1716301290382
  🧩 Skills: intent-parser, provider-ranker, price-estimator, schedule-manager...
  🔧 Tools: 6 Google tools integrated
  📡 MCP: Firebase MCP Server, Google Maps MCP, Sequential Thinking MCP
```

---

## 📱 Core Application Functions & Screens

KaamConnect is not just an AI interface; it is a fully realized, responsive mobile experience. The application features **20 specialized screens and functional modules** designed for seamless user interaction:

### 1. 🔐 User Authentication & Onboarding
*   **Welcome Screen (`WelcomeScreen.js`):** A visually compelling introduction displaying the app's mission to uplift informal workers.
*   **Secure Authentication (`AuthScreen.js`):** Supports secure phone number authentication and mock social logins.
*   **Onboarding Location Picker (`OnboardingAddressScreen.js`):** Requests foreground permission and immediately allows users to mark their home base using our custom interactive map.

### 2. 🏠 Discovery, Categories & Providers
*   **Dynamic Home Screen (`HomeScreen.js`):** Rich, premium landing page featuring active bookings, recent services, promo cards, a universal conversational search bar, and grid categories.
*   **Service Category Explorer (`HomeServicesScreen.js`):** Browse specialized domains like AC Maintenance, Electrical, Plumbing, Cleaning, and Personal Care.
*   **Discovery Map & List (`ProvidersListScreen.js` / `ProvidersScreen.js`):** Automatically maps nearby providers detected by the Discovery Agent with distances, ratings, and rates.
*   **Provider Profile Screen (`ProviderMenuScreen.js`):** Detailed menus for selected technicians, including user reviews, pricing guidelines, past works, and quick-booking CTAs.

### 3. 💬 Conversational Core (Agent Chat)
*   **Conversational Agent Chat (`ChatScreen.js`):** The primary interaction screen supporting conversational English, pure Urdu, and Roman Urdu. It instantly accepts complex natural language prompts.
*   **Live Antigravity Telemetry (`AgentTraceScreen.js`):** Displays real-time streaming WebSockets logs directly from the Antigravity backend, showing the user exactly what each agent (Intent, Discovery, Matcher) is doing at every step.

### 4. 🗺️ Location & Booking Automation
*   **Interactive Leaflet Map (`AddressScreen.js`):** Uses an ultra-fast, keyless **Leaflet + OpenStreetMap** engine embedded via native WebViews. Supports manual pin-dropping, immediate coordinate mapping, and non-blocking reverse-geocoding fallbacks.
*   **Timezone-Aware Scheduling (`CheckoutScreen.js`):** Eliminates time-shifting bugs. Correctly formats local Pakistan Standard Time (PKT, UTC+5) time slots, highlighting "Today" and "Tomorrow" booking targets.
*   **Booking Receipts (`BookingConfirmedScreen.js` / `BookingSuccessScreen.js`):** Dynamically outputs verified booking codes, assigned technicians, billing summaries, and scheduling states.

### 5. 📋 Booking Management & User Profile
*   **Active Requests Tracker (`ActiveRequestsScreen.js` / `BookingsScreen.js`):** Displays progress updates, live provider tracking, and statuses for ongoing works.
*   **Profile & Customization (`ProfileScreen.js` / `SettingsScreen.js`):** Manage contact numbers, preferred languages, and application parameters.

---

## 📍 Assumptions & Limitations

1.  **Mock Provider Dataset:** Provider availability schedules, prices, and ratings are loaded from a robust mock database tailored to Karachi's urban sectors (Clifton, Gulshan-e-Iqbal, Defense, Tariq Road).
2.  **Internet Requirement:** Because map tiles are loaded via OpenStreetMap CDN, the mobile app requires an active internet connection to load mapping visual aids.
3.  **Authentication:** Simple phone or social login is simulated using Firebase Auth sandbox limits.

---
*Created with passion for the Google Antigravity Hackathon.*