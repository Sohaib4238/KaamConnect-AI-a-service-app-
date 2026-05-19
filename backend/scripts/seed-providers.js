import 'dotenv/config';
import { db } from '../src/config/firebase.js';
import { PROVIDERS } from '../src/config/firestore-schema.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Service account project:', require('../service-account.json').project_id);
console.log('Service account client email:', require('../service-account.json').client_email);

const SERVICES_BY_CATEGORY = {
  'AC_REPAIR': [
    { id: 'ac_01', name: 'AC General Service', price: 2500, duration_mins: 60, description: 'Complete AC cleaning and gas check' },
    { id: 'ac_02', name: 'AC Gas Refill', price: 3500, duration_mins: 45, description: 'Refrigerant refill for optimal cooling' },
    { id: 'ac_03', name: 'AC Installation (1 ton)', price: 4500, duration_mins: 120, description: 'Full installation with pipe fitting' },
    { id: 'ac_04', name: 'AC Installation (1.5 ton)', price: 5500, duration_mins: 150, description: 'Full installation with pipe fitting' },
    { id: 'ac_05', name: 'AC Repair - Compressor', price: 8000, duration_mins: 90, description: 'Compressor diagnosis and repair' },
    { id: 'ac_06', name: 'AC Remote Repair', price: 800, duration_mins: 30, description: 'Remote control repair or replacement' },
  ],
  'ELECTRICIAN': [
    { id: 'el_01', name: 'Wiring Inspection', price: 1500, duration_mins: 45, description: 'Complete home wiring checkup' },
    { id: 'el_02', name: 'Switch/Socket Installation', price: 500, duration_mins: 30, description: 'Per switch or socket installation' },
    { id: 'el_03', name: 'Fan Installation', price: 800, duration_mins: 30, description: 'Ceiling fan fitting and wiring' },
    { id: 'el_04', name: 'MCB/Fuse Replacement', price: 1200, duration_mins: 30, description: 'Circuit breaker replacement' },
    { id: 'el_05', name: 'Inverter/UPS Installation', price: 2000, duration_mins: 60, description: 'UPS wiring and installation' },
    { id: 'el_06', name: 'Complete Rewiring', price: 15000, duration_mins: 480, description: 'Full home rewiring (per room pricing)' },
  ],
  'PLUMBER': [
    { id: 'pl_01', name: 'Pipe Leak Repair', price: 1200, duration_mins: 45, description: 'Fix leaking pipes and joints' },
    { id: 'pl_02', name: 'Tap/Faucet Replacement', price: 800, duration_mins: 30, description: 'New tap installation' },
    { id: 'pl_03', name: 'Toilet Repair', price: 1500, duration_mins: 60, description: 'Flush system and seat repair' },
    { id: 'pl_04', name: 'Water Motor Installation', price: 3500, duration_mins: 90, description: 'Submersible or surface pump' },
    { id: 'pl_05', name: 'Drain Cleaning', price: 2000, duration_mins: 60, description: 'Blocked drain clearing' },
    { id: 'pl_06', name: 'Geyser Installation', price: 2500, duration_mins: 60, description: 'Water heater fitting and plumbing' },
  ],
  'CARPENTER': [
    { id: 'ca_01', name: 'Door Repair', price: 1500, duration_mins: 60, description: 'Door fitting, lock, or hinge repair' },
    { id: 'ca_02', name: 'Furniture Repair', price: 2000, duration_mins: 90, description: 'Chair, table, or cabinet repair' },
    { id: 'ca_03', name: 'Kitchen Cabinet Work', price: 5000, duration_mins: 180, description: 'Cabinet installation or repair' },
    { id: 'ca_04', name: 'Wardrobe Installation', price: 8000, duration_mins: 240, description: 'Built-in wardrobe fitting' },
    { id: 'ca_05', name: 'Window Repair', price: 1200, duration_mins: 45, description: 'Window frame and lock repair' },
  ],
  'PAINTER': [
    { id: 'pa_01', name: 'Room Painting (1 room)', price: 4000, duration_mins: 240, description: 'Wall and ceiling painting' },
    { id: 'pa_02', name: 'Exterior Wall Painting', price: 8000, duration_mins: 480, description: 'Outside wall per 100 sqft' },
    { id: 'pa_03', name: 'Texture Painting', price: 6000, duration_mins: 300, description: 'Decorative texture per room' },
    { id: 'pa_04', name: 'Touch-up Work', price: 1500, duration_mins: 120, description: 'Small patch and touch-up' },
  ],
  'TUTOR': [
    { id: 'tu_01', name: 'Maths Tutoring (1 hour)', price: 1500, duration_mins: 60, description: 'O/A level or matric maths' },
    { id: 'tu_02', name: 'Physics Tutoring (1 hour)', price: 1500, duration_mins: 60, description: 'O/A level or matric physics' },
    { id: 'tu_03', name: 'English Tutoring (1 hour)', price: 1200, duration_mins: 60, description: 'Grammar, writing, and speaking' },
    { id: 'tu_04', name: 'Chemistry Tutoring (1 hour)', price: 1500, duration_mins: 60, description: 'O/A level or matric chemistry' },
    { id: 'tu_05', name: 'Monthly Package (20 sessions)', price: 20000, duration_mins: 60, description: 'Daily 1-hour sessions for a month' },
  ],
  'BEAUTICIAN': [
    { id: 'be_01', name: 'Basic Facial', price: 2000, duration_mins: 60, description: 'Cleansing and moisturizing facial' },
    { id: 'be_02', name: 'Bridal Makeup', price: 15000, duration_mins: 180, description: 'Complete bridal look with hairstyle' },
    { id: 'be_03', name: 'Threading (Full Face)', price: 500, duration_mins: 30, description: 'Eyebrow and full face threading' },
    { id: 'be_04', name: 'Waxing (Full Body)', price: 3000, duration_mins: 90, description: 'Full body waxing service' },
    { id: 'be_05', name: 'Hair Color', price: 4000, duration_mins: 120, description: 'Global hair color with treatment' },
  ],
  'CLEANER': [
    { id: 'cl_01', name: 'Home Deep Clean (2BHK)', price: 5000, duration_mins: 240, description: 'Full apartment deep cleaning' },
    { id: 'cl_02', name: 'Kitchen Deep Clean', price: 2500, duration_mins: 120, description: 'Stove, tiles, cabinets cleaning' },
    { id: 'cl_03', name: 'Sofa/Carpet Cleaning', price: 3000, duration_mins: 120, description: 'Steam cleaning per sofa set' },
    { id: 'cl_04', name: 'Post-Construction Clean', price: 8000, duration_mins: 360, description: 'Debris and dust removal after work' },
  ],
  'DRIVER': [
    { id: 'dr_01', name: 'Airport Transfer', price: 2000, duration_mins: 60, description: 'One-way airport drop or pickup' },
    { id: 'dr_02', name: 'Monthly Driver Service', price: 30000, duration_mins: 0, description: '8 hours/day dedicated driver' },
    { id: 'dr_03', name: 'Outstation Trip (per day)', price: 5000, duration_mins: 480, description: 'Full day outstation driving' },
  ],
  'GARDENER': [
    { id: 'ga_01', name: 'Garden Trimming', price: 1500, duration_mins: 120, description: 'Hedge and grass trimming' },
    { id: 'ga_02', name: 'Garden Setup', price: 5000, duration_mins: 240, description: 'New garden layout and planting' },
    { id: 'ga_03', name: 'Plant Repotting', price: 800, duration_mins: 60, description: 'Per plant repotting service' },
  ]
};

const rawProviders = [
  // ── 1. AC_REPAIR ──
  {
    place_id: "PKR-KHI-AC-001",
    name: "Tariq AC Repair Masters",
    location: { lat: 24.8105, lng: 67.0452 }, // DHA Karachi
    service_categories: ["AC_REPAIR", "ELECTRICIAN"],
    phone: "+92-300-1234567",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.03,
      rating: 4.8,
      review_sentiment_score: 0.92,
      recent_jobs_completed: 120,
      price_range_pkr: { min: 1500, max: 4500 },
      skill_level: "expert",
      mohalla_trust_score: 0.94,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-AC-002",
    name: "Hassan Electric & AC",
    location: { lat: 24.9190, lng: 67.0980 }, // Gulshan Karachi
    service_categories: ["ELECTRICIAN", "AC_REPAIR"],
    phone: "+92-345-1112223",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.88,
      cancellation_rate: 0.1,
      rating: 4.5,
      review_sentiment_score: 0.85,
      recent_jobs_completed: 65,
      price_range_pkr: { min: 1000, max: 4000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.8,
      risk_score: 0.15
    }
  },
  {
    place_id: "PKR-KHI-AC-003",
    name: "Clifton Cooling Techs",
    location: { lat: 24.8220, lng: 67.0310 }, // Clifton
    service_categories: ["AC_REPAIR"],
    phone: "+92-333-8889991",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.91,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.89,
      recent_jobs_completed: 82,
      price_range_pkr: { min: 2000, max: 6000 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-KHI-AC-004",
    name: "Jauhar AC Specialists",
    location: { lat: 24.9130, lng: 67.1250 }, // Gulistan-e-Jauhar
    service_categories: ["AC_REPAIR"],
    phone: "+92-300-5554441",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.84,
      cancellation_rate: 0.08,
      rating: 4.3,
      review_sentiment_score: 0.81,
      recent_jobs_completed: 40,
      price_range_pkr: { min: 1200, max: 3500 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.83,
      risk_score: 0.12
    }
  },
  {
    place_id: "PKR-KHI-AC-005",
    name: "Saddar Cool & Care",
    location: { lat: 24.8580, lng: 67.0080 }, // Saddar
    service_categories: ["AC_REPAIR"],
    phone: "+92-321-9990001",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.86,
      cancellation_rate: 0.05,
      rating: 4.4,
      review_sentiment_score: 0.85,
      recent_jobs_completed: 75,
      price_range_pkr: { min: 1000, max: 3800 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.85,
      risk_score: 0.1
    }
  },
  {
    place_id: "PKR-KHI-AC-006",
    name: "PECHS Climate Pros",
    location: { lat: 24.8680, lng: 67.0540 }, // PECHS
    service_categories: ["AC_REPAIR", "ELECTRICIAN"],
    phone: "+92-312-3334441",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.93,
      cancellation_rate: 0.02,
      rating: 4.7,
      review_sentiment_score: 0.94,
      recent_jobs_completed: 98,
      price_range_pkr: { min: 1500, max: 5000 },
      skill_level: "expert",
      mohalla_trust_score: 0.92,
      risk_score: 0.03
    }
  },
  {
    place_id: "PKR-KHI-AC-007",
    name: "North Nazimabad Air Con",
    location: { lat: 24.9430, lng: 67.0390 }, // North Nazimabad
    service_categories: ["AC_REPAIR"],
    phone: "+92-300-8887771",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.89,
      cancellation_rate: 0.06,
      rating: 4.5,
      review_sentiment_score: 0.88,
      recent_jobs_completed: 53,
      price_range_pkr: { min: 1500, max: 4000 },
      skill_level: "expert",
      mohalla_trust_score: 0.9,
      risk_score: 0.08
    }
  },

  // ── 2. ELECTRICIAN ──
  {
    place_id: "PKR-KHI-EL-001",
    name: "Korangi Power Fixers",
    location: { lat: 24.8310, lng: 67.1120 }, // Korangi
    service_categories: ["ELECTRICIAN"],
    phone: "+92-345-2223331",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.87,
      cancellation_rate: 0.09,
      rating: 4.4,
      review_sentiment_score: 0.83,
      recent_jobs_completed: 49,
      price_range_pkr: { min: 500, max: 3000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.82,
      risk_score: 0.11
    }
  },
  {
    place_id: "PKR-KHI-EL-002",
    name: "Nazimabad Wiring Experts",
    location: { lat: 24.9100, lng: 67.0320 }, // Nazimabad
    service_categories: ["ELECTRICIAN"],
    phone: "+92-333-7778881",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.92,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.91,
      recent_jobs_completed: 80,
      price_range_pkr: { min: 600, max: 4000 },
      skill_level: "expert",
      mohalla_trust_score: 0.91,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-KHI-EL-003",
    name: "PECHS Bright Spark",
    location: { lat: 24.8710, lng: 67.0610 }, // PECHS
    service_categories: ["ELECTRICIAN"],
    phone: "+92-311-6667771",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.94,
      cancellation_rate: 0.02,
      rating: 4.8,
      review_sentiment_score: 0.96,
      recent_jobs_completed: 104,
      price_range_pkr: { min: 800, max: 5000 },
      skill_level: "expert",
      mohalla_trust_score: 0.95,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-EL-004",
    name: "Malir Electric Solutions",
    location: { lat: 24.8950, lng: 67.1910 }, // Malir
    service_categories: ["ELECTRICIAN"],
    phone: "+92-320-1110001",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.81,
      cancellation_rate: 0.12,
      rating: 4.1,
      review_sentiment_score: 0.79,
      recent_jobs_completed: 30,
      price_range_pkr: { min: 500, max: 2500 },
      skill_level: "basic",
      mohalla_trust_score: 0.77,
      risk_score: 0.2
    }
  },
  {
    place_id: "PKR-KHI-EL-005",
    name: "Clifton Elite Electricals",
    location: { lat: 24.8250, lng: 67.0280 }, // Clifton
    service_categories: ["ELECTRICIAN"],
    phone: "+92-300-3338882",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 43200000).toISOString(),
      on_time_score: 0.96,
      cancellation_rate: 0.01,
      rating: 4.9,
      review_sentiment_score: 0.98,
      recent_jobs_completed: 150,
      price_range_pkr: { min: 1000, max: 8000 },
      skill_level: "expert",
      mohalla_trust_score: 0.97,
      risk_score: 0.01
    }
  },
  {
    place_id: "PKR-KHI-EL-006",
    name: "Gulshan Power Pros",
    location: { lat: 24.9220, lng: 67.1020 }, // Gulshan
    service_categories: ["ELECTRICIAN"],
    phone: "+92-334-5556661",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.9,
      cancellation_rate: 0.05,
      rating: 4.5,
      review_sentiment_score: 0.88,
      recent_jobs_completed: 77,
      price_range_pkr: { min: 800, max: 3500 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.87,
      risk_score: 0.08
    }
  },

  // ── 3. PLUMBER ──
  {
    place_id: "PKR-KHI-PL-001",
    name: "Ali Plumbing Works DHA",
    location: { lat: 24.8020, lng: 67.0390 }, // DHA Karachi
    service_categories: ["PLUMBER"],
    phone: "+92-321-7654321",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.92,
      cancellation_rate: 0.02,
      rating: 4.8,
      review_sentiment_score: 0.95,
      recent_jobs_completed: 120,
      price_range_pkr: { min: 800, max: 3000 },
      skill_level: "expert",
      mohalla_trust_score: 0.95,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-KHI-PL-002",
    name: "Jauhar Pipe Master",
    location: { lat: 24.9080, lng: 67.1210 }, // Gulistan-e-Jauhar
    service_categories: ["PLUMBER"],
    phone: "+92-300-1110002",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.85,
      cancellation_rate: 0.07,
      rating: 4.3,
      review_sentiment_score: 0.8,
      recent_jobs_completed: 55,
      price_range_pkr: { min: 1000, max: 3500 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.82,
      risk_score: 0.12
    }
  },
  {
    place_id: "PKR-KHI-PL-003",
    name: "Saddar Water Flow",
    location: { lat: 24.8620, lng: 67.0030 }, // Saddar
    service_categories: ["PLUMBER"],
    phone: "+92-345-8889992",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.89,
      cancellation_rate: 0.05,
      rating: 4.4,
      review_sentiment_score: 0.86,
      recent_jobs_completed: 72,
      price_range_pkr: { min: 800, max: 2800 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.88,
      risk_score: 0.08
    }
  },
  {
    place_id: "PKR-KHI-PL-004",
    name: "Gulshan Swift Plumbers",
    location: { lat: 24.9150, lng: 67.1020 }, // Gulshan
    service_categories: ["PLUMBER"],
    phone: "+92-333-5551112",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.93,
      cancellation_rate: 0.03,
      rating: 4.6,
      review_sentiment_score: 0.9,
      recent_jobs_completed: 94,
      price_range_pkr: { min: 1200, max: 4000 },
      skill_level: "expert",
      mohalla_trust_score: 0.91,
      risk_score: 0.04
    }
  },
  {
    place_id: "PKR-KHI-PL-005",
    name: "Clifton Aqua Fix",
    location: { lat: 24.8280, lng: 67.0340 }, // Clifton
    service_categories: ["PLUMBER"],
    phone: "+92-311-2229992",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.01,
      rating: 4.8,
      review_sentiment_score: 0.96,
      recent_jobs_completed: 110,
      price_range_pkr: { min: 1500, max: 5000 },
      skill_level: "expert",
      mohalla_trust_score: 0.96,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-PL-006",
    name: "Nazimabad Sanitary Pros",
    location: { lat: 24.9120, lng: 67.0380 }, // Nazimabad
    service_categories: ["PLUMBER"],
    phone: "+92-300-6663332",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.82,
      cancellation_rate: 0.1,
      rating: 4.2,
      review_sentiment_score: 0.78,
      recent_jobs_completed: 42,
      price_range_pkr: { min: 800, max: 2500 },
      skill_level: "basic",
      mohalla_trust_score: 0.8,
      risk_score: 0.15
    }
  },

  // ── 4. CARPENTER ──
  {
    place_id: "PKR-KHI-CA-001",
    name: "Kashif Carpentry DHA",
    location: { lat: 24.8110, lng: 67.0400 }, // DHA
    service_categories: ["CARPENTER"],
    phone: "+92-300-9998887",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.8,
      cancellation_rate: 0.1,
      rating: 4.1,
      review_sentiment_score: 0.78,
      recent_jobs_completed: 35,
      price_range_pkr: { min: 1000, max: 5000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.8,
      risk_score: 0.15
    }
  },
  {
    place_id: "PKR-KHI-CA-002",
    name: "Malir Wood Masters",
    location: { lat: 24.8990, lng: 67.1970 }, // Malir
    service_categories: ["CARPENTER"],
    phone: "+92-321-4443333",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.83,
      cancellation_rate: 0.08,
      rating: 4.3,
      review_sentiment_score: 0.82,
      recent_jobs_completed: 48,
      price_range_pkr: { min: 1200, max: 6000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.84,
      risk_score: 0.1
    }
  },
  {
    place_id: "PKR-KHI-CA-003",
    name: "Korangi Furniture Hub",
    location: { lat: 24.8350, lng: 67.1220 }, // Korangi
    service_categories: ["CARPENTER"],
    phone: "+92-345-5550003",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.75,
      cancellation_rate: 0.15,
      rating: 3.9,
      review_sentiment_score: 0.7,
      recent_jobs_completed: 25,
      price_range_pkr: { min: 800, max: 4000 },
      skill_level: "basic",
      mohalla_trust_score: 0.72,
      risk_score: 0.25
    }
  },
  {
    place_id: "PKR-KHI-CA-004",
    name: "PECHS Wood Craft",
    location: { lat: 24.8670, lng: 67.0520 }, // PECHS
    service_categories: ["CARPENTER"],
    phone: "+92-333-1110003",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.91,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.92,
      recent_jobs_completed: 88,
      price_range_pkr: { min: 1500, max: 7000 },
      skill_level: "expert",
      mohalla_trust_score: 0.9,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-KHI-CA-005",
    name: "Gulshan Timber & Design",
    location: { lat: 24.9220, lng: 67.0940 }, // Gulshan
    service_categories: ["CARPENTER"],
    phone: "+92-300-8883333",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.88,
      cancellation_rate: 0.05,
      rating: 4.5,
      review_sentiment_score: 0.88,
      recent_jobs_completed: 60,
      price_range_pkr: { min: 1500, max: 8000 },
      skill_level: "expert",
      mohalla_trust_score: 0.87,
      risk_score: 0.08
    }
  },
  {
    place_id: "PKR-KHI-CA-006",
    name: "Clifton Premium Woodworks",
    location: { lat: 24.8210, lng: 67.0290 }, // Clifton
    service_categories: ["CARPENTER"],
    phone: "+92-312-7778883",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.02,
      rating: 4.8,
      review_sentiment_score: 0.95,
      recent_jobs_completed: 105,
      price_range_pkr: { min: 2000, max: 10000 },
      skill_level: "expert",
      mohalla_trust_score: 0.96,
      risk_score: 0.03
    }
  },

  // ── 5. PAINTER ──
  {
    place_id: "PKR-KHI-PA-001",
    name: "Gulshan Painters",
    location: { lat: 24.9150, lng: 67.0950 }, // Gulshan
    service_categories: ["PAINTER"],
    phone: "+92-311-4445556",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 172800000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.01,
      rating: 4.9,
      review_sentiment_score: 0.98,
      recent_jobs_completed: 80,
      price_range_pkr: { min: 5000, max: 25000 },
      skill_level: "expert",
      mohalla_trust_score: 0.92,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-PA-002",
    name: "Clifton Wall Art",
    location: { lat: 24.8260, lng: 67.0330 }, // Clifton
    service_categories: ["PAINTER"],
    phone: "+92-300-5558884",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.91,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.89,
      recent_jobs_completed: 64,
      price_range_pkr: { min: 6000, max: 30000 },
      skill_level: "expert",
      mohalla_trust_score: 0.9,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-KHI-PA-003",
    name: "DHA Rainbow Decor",
    location: { lat: 24.8080, lng: 67.0460 }, // DHA
    service_categories: ["PAINTER"],
    phone: "+92-321-7776664",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.93,
      cancellation_rate: 0.03,
      rating: 4.7,
      review_sentiment_score: 0.91,
      recent_jobs_completed: 85,
      price_range_pkr: { min: 8000, max: 35000 },
      skill_level: "expert",
      mohalla_trust_score: 0.93,
      risk_score: 0.03
    }
  },
  {
    place_id: "PKR-KHI-PA-004",
    name: "PECHS Bright Wall",
    location: { lat: 24.8720, lng: 67.0590 }, // PECHS
    service_categories: ["PAINTER"],
    phone: "+92-333-3339994",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.86,
      cancellation_rate: 0.08,
      rating: 4.3,
      review_sentiment_score: 0.81,
      recent_jobs_completed: 40,
      price_range_pkr: { min: 4000, max: 20000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.84,
      risk_score: 0.12
    }
  },
  {
    place_id: "PKR-KHI-PA-005",
    name: "Saddar Painting Crew",
    location: { lat: 24.8590, lng: 67.0040 }, // Saddar
    service_categories: ["PAINTER"],
    phone: "+92-345-1110004",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.83,
      cancellation_rate: 0.09,
      rating: 4.2,
      review_sentiment_score: 0.79,
      recent_jobs_completed: 33,
      price_range_pkr: { min: 3000, max: 15000 },
      skill_level: "basic",
      mohalla_trust_score: 0.8,
      risk_score: 0.15
    }
  },
  {
    place_id: "PKR-KHI-PA-006",
    name: "Nazimabad Painting Pro",
    location: { lat: 24.9160, lng: 67.0310 }, // Nazimabad
    service_categories: ["PAINTER"],
    phone: "+92-300-4440004",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.88,
      cancellation_rate: 0.06,
      rating: 4.5,
      review_sentiment_score: 0.87,
      recent_jobs_completed: 50,
      price_range_pkr: { min: 4000, max: 22000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.86,
      risk_score: 0.08
    }
  },

  // ── 6. TUTOR ──
  {
    place_id: "PKR-KHI-TU-001",
    name: "Siraj Maths Tutor",
    location: { lat: 24.9200, lng: 67.0990 }, // Gulshan
    service_categories: ["TUTOR"],
    phone: "+92-333-1231234",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000 * 5).toISOString(),
      on_time_score: 0.99,
      cancellation_rate: 0.05,
      rating: 4.7,
      review_sentiment_score: 0.9,
      recent_jobs_completed: 200,
      price_range_pkr: { min: 1500, max: 3000 },
      skill_level: "expert",
      mohalla_trust_score: 0.98,
      risk_score: 0.01
    }
  },
  {
    place_id: "PKR-KHI-TU-002",
    name: "DHA Science Academy",
    location: { lat: 24.8040, lng: 67.0410 }, // DHA
    service_categories: ["TUTOR"],
    phone: "+92-300-8889995",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.96,
      cancellation_rate: 0.02,
      rating: 4.8,
      review_sentiment_score: 0.94,
      recent_jobs_completed: 140,
      price_range_pkr: { min: 2000, max: 5000 },
      skill_level: "expert",
      mohalla_trust_score: 0.95,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-TU-003",
    name: "Clifton Language Lounge",
    location: { lat: 24.8240, lng: 67.0320 }, // Clifton
    service_categories: ["TUTOR"],
    phone: "+92-321-5550005",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.94,
      cancellation_rate: 0.03,
      rating: 4.7,
      review_sentiment_score: 0.92,
      recent_jobs_completed: 110,
      price_range_pkr: { min: 1500, max: 4000 },
      skill_level: "expert",
      mohalla_trust_score: 0.93,
      risk_score: 0.04
    }
  },
  {
    place_id: "PKR-KHI-TU-004",
    name: "PECHS Home Academy",
    location: { lat: 24.8690, lng: 67.0570 }, // PECHS
    service_categories: ["TUTOR"],
    phone: "+92-345-9998885",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.88,
      cancellation_rate: 0.06,
      rating: 4.4,
      review_sentiment_score: 0.85,
      recent_jobs_completed: 65,
      price_range_pkr: { min: 1200, max: 3000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.86,
      risk_score: 0.08
    }
  },
  {
    place_id: "PKR-KHI-TU-005",
    name: "Jauhar Matric & O-Level",
    location: { lat: 24.9110, lng: 67.1260 }, // Jauhar
    service_categories: ["TUTOR"],
    phone: "+92-333-4449995",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.85,
      cancellation_rate: 0.09,
      rating: 4.3,
      review_sentiment_score: 0.81,
      recent_jobs_completed: 50,
      price_range_pkr: { min: 1000, max: 2500 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.83,
      risk_score: 0.12
    }
  },
  {
    place_id: "PKR-KHI-TU-006",
    name: "North Nazimabad Tutors",
    location: { lat: 24.9480, lng: 67.0440 }, // North Nazimabad
    service_categories: ["TUTOR"],
    phone: "+92-311-8880005",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.9,
      cancellation_rate: 0.05,
      rating: 4.5,
      review_sentiment_score: 0.89,
      recent_jobs_completed: 82,
      price_range_pkr: { min: 1200, max: 3500 },
      skill_level: "expert",
      mohalla_trust_score: 0.89,
      risk_score: 0.06
    }
  },

  // ── 7. BEAUTICIAN ──
  {
    place_id: "PKR-KHI-BE-001",
    name: "Zara Beauty Salon DHA",
    location: { lat: 24.8065, lng: 67.0482 }, // DHA
    service_categories: ["BEAUTICIAN"],
    phone: "+92-333-5555666",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.78,
      cancellation_rate: 0.15,
      rating: 4.2,
      review_sentiment_score: 0.8,
      recent_jobs_completed: 30,
      price_range_pkr: { min: 2000, max: 8000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.7,
      risk_score: 0.2
    }
  },
  {
    place_id: "PKR-KHI-BE-002",
    name: "Faiza Bridal & Party Makeup",
    location: { lat: 24.9170, lng: 67.0940 }, // Gulshan
    service_categories: ["BEAUTICIAN"],
    phone: "+92-300-8887776",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.7,
      cancellation_rate: 0.18,
      rating: 4.0,
      review_sentiment_score: 0.75,
      recent_jobs_completed: 25,
      price_range_pkr: { min: 3000, max: 15000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.75,
      risk_score: 0.25
    }
  },
  {
    place_id: "PKR-KHI-BE-003",
    name: "Clifton Glow Glamour",
    location: { lat: 24.8230, lng: 67.0300 }, // Clifton
    service_categories: ["BEAUTICIAN"],
    phone: "+92-321-4440006",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.85,
      cancellation_rate: 0.08,
      rating: 4.4,
      review_sentiment_score: 0.86,
      recent_jobs_completed: 62,
      price_range_pkr: { min: 1500, max: 9000 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.09
    }
  },
  {
    place_id: "PKR-KHI-BE-004",
    name: "PECHS Beauty Zone",
    location: { lat: 24.8700, lng: 67.0560 }, // PECHS
    service_categories: ["BEAUTICIAN"],
    phone: "+92-345-3339996",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.89,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.91,
      recent_jobs_completed: 78,
      price_range_pkr: { min: 2000, max: 10000 },
      skill_level: "expert",
      mohalla_trust_score: 0.9,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-KHI-BE-005",
    name: "Saddar Bridal Express",
    location: { lat: 24.8610, lng: 67.0060 }, // Saddar
    service_categories: ["BEAUTICIAN"],
    phone: "+92-300-1112226",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 43200000).toISOString(),
      on_time_score: 0.82,
      cancellation_rate: 0.1,
      rating: 4.3,
      review_sentiment_score: 0.83,
      recent_jobs_completed: 45,
      price_range_pkr: { min: 1500, max: 7000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.82,
      risk_score: 0.11
    }
  },
  {
    place_id: "PKR-KHI-BE-006",
    name: "Jauhar Queens Parlour",
    location: { lat: 24.9150, lng: 67.1290 }, // Jauhar
    service_categories: ["BEAUTICIAN"],
    phone: "+92-333-8881116",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.87,
      cancellation_rate: 0.06,
      rating: 4.5,
      review_sentiment_score: 0.87,
      recent_jobs_completed: 58,
      price_range_pkr: { min: 1800, max: 8500 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.07
    }
  },

  // ── 8. CLEANER ──
  {
    place_id: "PKR-KHI-CL-001",
    name: "DHA Sparkle Cleaners",
    location: { lat: 24.8070, lng: 67.0490 }, // DHA
    service_categories: ["CLEANER"],
    phone: "+92-300-3332227",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.94,
      cancellation_rate: 0.02,
      rating: 4.8,
      review_sentiment_score: 0.95,
      recent_jobs_completed: 102,
      price_range_pkr: { min: 2500, max: 8000 },
      skill_level: "expert",
      mohalla_trust_score: 0.93,
      risk_score: 0.03
    }
  },
  {
    place_id: "PKR-KHI-CL-002",
    name: "Gulshan Clean & Green",
    location: { lat: 24.9180, lng: 67.0960 }, // Gulshan
    service_categories: ["CLEANER"],
    phone: "+92-321-4447777",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.88,
      cancellation_rate: 0.06,
      rating: 4.5,
      review_sentiment_score: 0.87,
      recent_jobs_completed: 70,
      price_range_pkr: { min: 2000, max: 6000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.86,
      risk_score: 0.07
    }
  },
  {
    place_id: "PKR-KHI-CL-003",
    name: "Clifton Hygiene Experts",
    location: { lat: 24.8250, lng: 67.0350 }, // Clifton
    service_categories: ["CLEANER"],
    phone: "+92-333-8880007",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.01,
      rating: 4.9,
      review_sentiment_score: 0.97,
      recent_jobs_completed: 130,
      price_range_pkr: { min: 3000, max: 10000 },
      skill_level: "expert",
      mohalla_trust_score: 0.96,
      risk_score: 0.01
    }
  },
  {
    place_id: "PKR-KHI-CL-004",
    name: "PECHS Deep Cleaning",
    location: { lat: 24.8660, lng: 67.0580 }, // PECHS
    service_categories: ["CLEANER"],
    phone: "+92-345-1110007",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.87,
      cancellation_rate: 0.07,
      rating: 4.4,
      review_sentiment_score: 0.84,
      recent_jobs_completed: 55,
      price_range_pkr: { min: 2500, max: 7000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.85,
      risk_score: 0.08
    }
  },
  {
    place_id: "PKR-KHI-CL-005",
    name: "Korangi Eco Cleaners",
    location: { lat: 24.8320, lng: 67.1180 }, // Korangi
    service_categories: ["CLEANER"],
    phone: "+92-311-7771117",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.81,
      cancellation_rate: 0.12,
      rating: 4.0,
      review_sentiment_score: 0.76,
      recent_jobs_completed: 28,
      price_range_pkr: { min: 1500, max: 5000 },
      skill_level: "basic",
      mohalla_trust_score: 0.77,
      risk_score: 0.18
    }
  },
  {
    place_id: "PKR-KHI-CL-006",
    name: "Nazimabad Home Sanitizers",
    location: { lat: 24.9140, lng: 67.0360 }, // Nazimabad
    service_categories: ["CLEANER"],
    phone: "+92-300-6668887",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.89,
      cancellation_rate: 0.05,
      rating: 4.5,
      review_sentiment_score: 0.88,
      recent_jobs_completed: 63,
      price_range_pkr: { min: 2000, max: 5500 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.06
    }
  },

  // ── 9. DRIVER ──
  {
    place_id: "PKR-KHI-DR-001",
    name: "DHA Premium Chauffeurs",
    location: { lat: 24.8010, lng: 67.0430 }, // DHA
    service_categories: ["DRIVER"],
    phone: "+92-300-7778888",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.97,
      cancellation_rate: 0.01,
      rating: 4.9,
      review_sentiment_score: 0.98,
      recent_jobs_completed: 180,
      price_range_pkr: { min: 2000, max: 30000 },
      skill_level: "expert",
      mohalla_trust_score: 0.98,
      risk_score: 0.01
    }
  },
  {
    place_id: "PKR-KHI-DR-002",
    name: "Gulshan Ride Assist",
    location: { lat: 24.9160, lng: 67.0930 }, // Gulshan
    service_categories: ["DRIVER"],
    phone: "+92-321-8889998",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.9,
      cancellation_rate: 0.05,
      rating: 4.5,
      review_sentiment_score: 0.88,
      recent_jobs_completed: 85,
      price_range_pkr: { min: 1500, max: 25000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.89,
      risk_score: 0.06
    }
  },
  {
    place_id: "PKR-KHI-DR-003",
    name: "Clifton Safe Drivers",
    location: { lat: 24.8200, lng: 67.0270 }, // Clifton
    service_categories: ["DRIVER"],
    phone: "+92-333-1110008",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.02,
      rating: 4.8,
      review_sentiment_score: 0.95,
      recent_jobs_completed: 120,
      price_range_pkr: { min: 2000, max: 28000 },
      skill_level: "expert",
      mohalla_trust_score: 0.96,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-DR-004",
    name: "PECHS Chauffeur Services",
    location: { lat: 24.8680, lng: 67.0600 }, // PECHS
    service_categories: ["DRIVER"],
    phone: "+92-345-4449998",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.86,
      cancellation_rate: 0.07,
      rating: 4.4,
      review_sentiment_score: 0.82,
      recent_jobs_completed: 50,
      price_range_pkr: { min: 1500, max: 22000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.84,
      risk_score: 0.09
    }
  },
  {
    place_id: "PKR-KHI-DR-005",
    name: "Saddar Daily Drivers",
    location: { lat: 24.8570, lng: 67.0020 }, // Saddar
    service_categories: ["DRIVER"],
    phone: "+92-311-2228888",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.82,
      cancellation_rate: 0.1,
      rating: 4.1,
      review_sentiment_score: 0.78,
      recent_jobs_completed: 38,
      price_range_pkr: { min: 1200, max: 20000 },
      skill_level: "basic",
      mohalla_trust_score: 0.8,
      risk_score: 0.15
    }
  },
  {
    place_id: "PKR-KHI-DR-006",
    name: "Malir Express Drivers",
    location: { lat: 24.8960, lng: 67.1930 }, // Malir
    service_categories: ["DRIVER"],
    phone: "+92-300-6669998",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.91,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.9,
      recent_jobs_completed: 75,
      price_range_pkr: { min: 1500, max: 25000 },
      skill_level: "expert",
      mohalla_trust_score: 0.91,
      risk_score: 0.04
    }
  },

  // ── 10. GARDENER ──
  {
    place_id: "PKR-KHI-GA-001",
    name: "DHA Green Thumb",
    location: { lat: 24.8030, lng: 67.0440 }, // DHA
    service_categories: ["GARDENER"],
    phone: "+92-300-1119999",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.93,
      cancellation_rate: 0.03,
      rating: 4.7,
      review_sentiment_score: 0.92,
      recent_jobs_completed: 92,
      price_range_pkr: { min: 1500, max: 6000 },
      skill_level: "expert",
      mohalla_trust_score: 0.94,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-KHI-GA-002",
    name: "Clifton Flora & Lawn",
    location: { lat: 24.8220, lng: 67.0290 }, // Clifton
    service_categories: ["GARDENER"],
    phone: "+92-321-2223339",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.01,
      rating: 4.8,
      review_sentiment_score: 0.95,
      recent_jobs_completed: 108,
      price_range_pkr: { min: 2000, max: 7000 },
      skill_level: "expert",
      mohalla_trust_score: 0.96,
      risk_score: 0.01
    }
  },
  {
    place_id: "PKR-KHI-GA-003",
    name: "Gulshan Nursery Crew",
    location: { lat: 24.9210, lng: 67.0970 }, // Gulshan
    service_categories: ["GARDENER"],
    phone: "+92-333-4445559",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 5400000).toISOString(),
      on_time_score: 0.86,
      cancellation_rate: 0.08,
      rating: 4.4,
      review_sentiment_score: 0.83,
      recent_jobs_completed: 50,
      price_range_pkr: { min: 1200, max: 5000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.85,
      risk_score: 0.09
    }
  },
  {
    place_id: "PKR-KHI-GA-004",
    name: "PECHS Landscape Masters",
    location: { lat: 24.8730, lng: 67.0550 }, // PECHS
    service_categories: ["GARDENER"],
    phone: "+92-345-5556669",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.89,
      cancellation_rate: 0.05,
      rating: 4.5,
      review_sentiment_score: 0.88,
      recent_jobs_completed: 72,
      price_range_pkr: { min: 1500, max: 5500 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.06
    }
  },
  {
    place_id: "PKR-KHI-GA-005",
    name: "Jauhar Greenery Hub",
    location: { lat: 24.9140, lng: 67.1230 }, // Jauhar
    service_categories: ["GARDENER"],
    phone: "+92-311-8889999",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.82,
      cancellation_rate: 0.1,
      rating: 4.2,
      review_sentiment_score: 0.79,
      recent_jobs_completed: 40,
      price_range_pkr: { min: 1000, max: 4500 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.81,
      risk_score: 0.12
    }
  },
  {
    place_id: "PKR-KHI-GA-006",
    name: "North Nazimabad Garden Care",
    location: { lat: 24.9460, lng: 67.0410 }, // North Nazimabad
    service_categories: ["GARDENER"],
    phone: "+92-300-6667779",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.9,
      cancellation_rate: 0.04,
      rating: 4.6,
      review_sentiment_score: 0.9,
      recent_jobs_completed: 68,
      price_range_pkr: { min: 1500, max: 5800 },
      skill_level: "expert",
      mohalla_trust_score: 0.91,
      risk_score: 0.04
    }
  },

  // ── 11. ISLAMABAD PROVIDERS (Retained for existing test suite compatibility) ──
  {
    place_id: "PKR-ISB-001",
    name: "Capital AC Services",
    location: { lat: 33.6490, lng: 72.9840 }, // G-13 Islamabad
    service_categories: ["AC_REPAIR"],
    phone: "+92-321-1112223",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 1800000).toISOString(),
      on_time_score: 0.9,
      cancellation_rate: 0.05,
      rating: 4.7,
      review_sentiment_score: 0.92,
      recent_jobs_completed: 55,
      price_range_pkr: { min: 2000, max: 5000 },
      skill_level: "expert",
      mohalla_trust_score: 0.85,
      risk_score: 0.1
    }
  },
  {
    place_id: "PKR-ISB-002",
    name: "G-13 Fix-It Plumbers",
    location: { lat: 33.6470, lng: 72.9820 },
    service_categories: ["PLUMBER"],
    phone: "+92-333-2223334",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000 * 2).toISOString(),
      on_time_score: 0.8,
      cancellation_rate: 0.1,
      rating: 4.1,
      review_sentiment_score: 0.8,
      recent_jobs_completed: 35,
      price_range_pkr: { min: 1000, max: 4000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.8,
      risk_score: 0.15
    }
  },
  {
    place_id: "PKR-ISB-003",
    name: "Nawaz Woodworks",
    location: { lat: 33.6485, lng: 72.9850 },
    service_categories: ["CARPENTER"],
    phone: "+92-300-3334445",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 86400000).toISOString(),
      on_time_score: 0.85,
      cancellation_rate: 0.12,
      rating: 4.3,
      review_sentiment_score: 0.85,
      recent_jobs_completed: 40,
      price_range_pkr: { min: 1500, max: 8000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.82,
      risk_score: 0.12
    }
  },
  {
    place_id: "PKR-ISB-004",
    name: "F-7 Elite Electric",
    location: { lat: 33.7190, lng: 73.0560 }, // F-7 Islamabad
    service_categories: ["ELECTRICIAN"],
    phone: "+92-345-4445556",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.95,
      cancellation_rate: 0.02,
      rating: 4.9,
      review_sentiment_score: 0.96,
      recent_jobs_completed: 90,
      price_range_pkr: { min: 1500, max: 5000 },
      skill_level: "expert",
      mohalla_trust_score: 0.95,
      risk_score: 0.05
    }
  },
  {
    place_id: "PKR-ISB-005",
    name: "Islamabad Premium Painters",
    location: { lat: 33.7170, lng: 73.0540 },
    service_categories: ["PAINTER"],
    phone: "+92-311-5556667",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 172800000).toISOString(),
      on_time_score: 0.9,
      cancellation_rate: 0.05,
      rating: 4.6,
      review_sentiment_score: 0.9,
      recent_jobs_completed: 60,
      price_range_pkr: { min: 8000, max: 40000 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.08
    }
  },
  {
    place_id: "PKR-ISB-006",
    name: "Sana Science Academy",
    location: { lat: 33.7200, lng: 73.0570 },
    service_categories: ["TUTOR"],
    phone: "+92-333-6667778",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000 * 24).toISOString(),
      on_time_score: 0.98,
      cancellation_rate: 0.01,
      rating: 4.8,
      review_sentiment_score: 0.95,
      recent_jobs_completed: 150,
      price_range_pkr: { min: 3000, max: 6000 },
      skill_level: "expert",
      mohalla_trust_score: 0.96,
      risk_score: 0.02
    }
  },
  {
    place_id: "PKR-ISB-007",
    name: "F-7 Glow Beauty",
    location: { lat: 33.7160, lng: 73.0530 },
    service_categories: ["BEAUTICIAN"],
    phone: "+92-300-7778889",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.85,
      cancellation_rate: 0.1,
      rating: 4.4,
      review_sentiment_score: 0.85,
      recent_jobs_completed: 45,
      price_range_pkr: { min: 4000, max: 20000 },
      skill_level: "intermediate",
      mohalla_trust_score: 0.85,
      risk_score: 0.15
    }
  }
];

async function seedProviders() {
  if (!db) {
    console.error('Firestore instance not available. Make sure firebase-admin is initialized.');
    process.exit(1);
  }

  console.log(`Testing connectivity before seeding...`);
  try {
    await db.collection('_connectivity_test').doc('test').set({ timestamp: Date.now() });
    console.log(`✅ Connectivity test passed`);
  } catch (error) {
    console.error(`❌ Connectivity test failed:`, JSON.stringify(error, null, 2));
    process.exit(1);
  }

  // Pre-process rawProviders to inject fully compliance services list and booked_slots structure
  const formattedProviders = rawProviders.map(p => {
    let services = [];
    p.service_categories.forEach(cat => {
      if (SERVICES_BY_CATEGORY[cat]) {
        services = [...services, ...SERVICES_BY_CATEGORY[cat]];
      }
    });

    return {
      ...p,
      services,
      booked_slots: []
    };
  });

  console.log(`Starting to seed ${formattedProviders.length} providers with full services arrays...`);

  let successCount = 0;
  let failureCount = 0;

  for (const provider of formattedProviders) {
    try {
      const docRef = db.collection(PROVIDERS).doc(provider.place_id);
      await docRef.set(provider);
      console.log(`✅ Successfully seeded: ${provider.name} (${provider.place_id}) - offers ${provider.services.length} services.`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to seed: ${provider.name} (${provider.place_id}) - Error:`, error.message);
      failureCount++;
    }
  }

  console.log('--- Seeding Completed ---');
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  process.exit(0);
}

seedProviders();
