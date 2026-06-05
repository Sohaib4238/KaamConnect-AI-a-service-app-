# 🆓 Final Plan — 100% Free Stack

## What Changed
- ❌ No Google Cloud — no $300 credit available
- ✅ Google AI Studio free tier — no billing, no credit card
- ✅ 100% mock data — no paid Maps/Places API
- ✅ Everything else stays the same

---

## 1. Free Tier — What We Get

### Google AI Studio (Free, No Billing)

| Model | RPM | RPD | Cost |
|-------|-----|-----|------|
| **Gemini 2.5 Flash** ✅ | 10 req/min | 250 req/day | **$0** |
| Gemini 2.5 Flash-Lite | 15 req/min | 1,000 req/day | **$0** |

> [!WARNING]
> **10 RPM and 250 RPD is tight.** Our multi-agent pipeline makes ~5 Gemini calls per user request (1 per agent). That means:
> - Max **2 full user requests per minute**
> - Max **50 full user requests per day**
> 
> This is enough for development + demo, but we MUST build smart caching.

### Rate Limit Strategy

```
User Request
     │
     ▼
┌──────────────┐     Cache Hit?     ┌──────────────┐
│  Check Cache │────── YES ────────▶│ Return Cached │
│              │                    │   Response    │
└──────┬───────┘                    └──────────────┘
       │ NO
       ▼
┌──────────────┐
│  Call Gemini  │──── Track RPM ──── If 429 error → wait + retry
│  (2.5 Flash)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Cache Result │ ← Cache similar queries for 10 min
└──────────────┘
```

**Mitigations we'll build:**
1. **Response caching** — identical/similar queries return cached results instantly
2. **Intent parsing optimization** — combine Intent + Discovery into 1 Gemini call when possible
3. **Exponential backoff** — graceful retry on 429 errors
4. **Pre-computed demo responses** — for the demo video, pre-warm cache with known scenarios
5. **Flash-Lite fallback** — use `2.5-flash-lite` (15 RPM) for simpler tasks like follow-up scheduling

---

## 2. Complete Free Stack

| Component | Tool | Cost | Notes |
|-----------|------|------|-------|
| **LLM** | Gemini 2.5 Flash (AI Studio) | Free | 10 RPM, 250 RPD |
| **Backend** | Node.js + Express | Free | Open source |
| **Database** | SQLite | Free | File-based, no server |
| **Mobile** | React Native Expo + Expo Go | Free | Test on iPhone |
| **Web** | HTML/CSS/JS (optional) | Free | Static files |
| **Provider Data** | Mock JSON dataset | Free | 50+ providers, hand-crafted |
| **Location Data** | Hardcoded Islamabad coordinates | Free | Pre-mapped areas (G-13, F-8, etc.) |
| **Maps Display** | OpenStreetMap / Leaflet (web) | Free | No Google Maps needed |
| **IDE** | Google Antigravity | Free | This tool |
| **Version Control** | Git | Free | Local |

**Total cost: $0**

---

## 3. How We Handle "No Google Maps"

### Pre-built Location Database (Islamabad Sectors)

Instead of calling Geocoding API, we hardcode the well-known Islamabad grid:

```javascript
const ISLAMABAD_SECTORS = {
  "G-13":  { lat: 33.6316, lng: 72.9781, name: "G-13, Islamabad" },
  "G-11":  { lat: 33.6418, lng: 72.9860, name: "G-11, Islamabad" },
  "G-10":  { lat: 33.6499, lng: 72.9912, name: "G-10, Islamabad" },
  "G-9":   { lat: 33.6568, lng: 72.9978, name: "G-9, Islamabad" },
  "G-8":   { lat: 33.6623, lng: 73.0132, name: "G-8, Islamabad" },
  "F-8":   { lat: 33.6938, lng: 73.0228, name: "F-8, Islamabad" },
  "F-10":  { lat: 33.6836, lng: 73.0106, name: "F-10, Islamabad" },
  "F-11":  { lat: 33.6762, lng: 72.9988, name: "F-11, Islamabad" },
  "I-8":   { lat: 33.6644, lng: 73.0773, name: "I-8, Islamabad" },
  "I-10":  { lat: 33.6521, lng: 73.0587, name: "I-10, Islamabad" },
  "Blue Area": { lat: 33.7104, lng: 73.0491, name: "Blue Area, Islamabad" },
  // ... 20+ more sectors
};
```

This is **actually more reliable** than a Geocoding API call for Islamabad sectors — Gemini can extract "G-13" from input, we resolve it instantly, zero latency, zero cost.

### Distance Calculation — Haversine Formula (No API needed)

```javascript
// Calculate distance between two lat/lng points
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + 
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * 
            Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

---

## 4. Model Usage Strategy (Optimized for Free Tier)

| Agent | Model | Why |
|-------|-------|-----|
| **Orchestrator** | Gemini 2.5 Flash | Needs reasoning + tool calling |
| **Intent Agent** | Gemini 2.5 Flash | Multilingual NLU needs best model |
| **Discovery Agent** | **No LLM needed** | Pure database query — code only |
| **Matching Agent** | **No LLM needed** | Scoring algorithm — code only |
| **Booking Agent** | **No LLM needed** | DB insert — code only |
| **Follow-Up Agent** | **No LLM needed** | Scheduling logic — code only |
| **Response Generation** | Gemini 2.5 Flash | Final natural language response |

> [!TIP]
> **Key optimization**: Only 2-3 Gemini calls per request instead of 5!
> - Call 1: Orchestrator + Intent parsing (combined)
> - Discovery, Matching, Booking, Follow-Up = pure code (no LLM needed)
> - Call 2: Generate user-facing natural language response with reasoning
> 
> This cuts our API usage in half while still having **5 distinct agents with full trace logs**.

This means:
- **~3 Gemini calls per request** (not 5)
- **~3 RPM used per request** (fits in 10 RPM)
- **~80 full requests per day** (fits in 250 RPD)

---

## 5. Final Checklist — What You Need

| Item | Status | Action |
|------|--------|--------|
| **Gemini API Key** | ❌ | Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Create key (2 min, free, no billing) |
| **Node.js 18+** | ✅ | You confirmed installed |
| **npm** | ✅ | Comes with Node.js |
| **Git** | ✅ | You confirmed installed |
| **iPhone + Expo Go** | ✅ | Install from App Store |
| **Same WiFi** | ⚠️ | PC and iPhone must be on same network for Expo Go |

---

## 6. Summary of All Plan Versions

| Version | Change | Status |
|---------|--------|--------|
| V1 | Gemini 2.0 Flash + AI Studio | ❌ Model deprecated |
| V2 | Gemini 2.5 Flash + Google Cloud $305 | ❌ No credits available |
| **V3 (Final)** | **Gemini 2.5 Flash + AI Studio Free + Mock Data** | ✅ **Current plan** |

### What stays the same across all versions:
- ✅ 5-agent architecture (Orchestrator → Intent → Discovery → Matching → Booking → Follow-Up)
- ✅ Node.js + Express + SQLite backend
- ✅ React Native Expo mobile app
- ✅ Full agent trace logging
- ✅ Professional code quality
- ✅ 4-day timeline

### What's different in V3:
- 🔄 Smart caching to handle 10 RPM limit
- 🔄 Only 2-3 LLM calls per request (Discovery/Matching/Booking are pure code)
- 🔄 Pre-built Islamabad location database (no Geocoding API)
- 🔄 Haversine distance formula (no Maps API)
- 🔄 100% mock provider data

---

> [!NOTE]
> **The mock data approach is explicitly endorsed by the challenge:**
> *"Use mock data if real APIs are unavailable"*
> 
> And our pre-built location database is actually **more reliable** for Islamabad sectors than the Geocoding API. Judges will see a system that **always works perfectly** — no API failures, no network issues, no billing surprises.
