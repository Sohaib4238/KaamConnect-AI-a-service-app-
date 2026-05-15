import 'dotenv/config';
import { db } from '../src/config/firebase.js';
import { PROVIDERS } from '../src/config/firestore-schema.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Service account project:', require('../service-account.json').project_id);
console.log('Service account client email:', require('../service-account.json').client_email);

const providers = [
  // DHA Karachi (approx lat: 24.8055, lng: 67.0422)
  {
    place_id: "PKR-KHI-001",
    name: "Tariq AC Repair Masters",
    location: { lat: 24.8105, lng: 67.0452 },
    service_categories: ["AC_REPAIR", "ELECTRICIAN"],
    phone: "+92-300-1234567",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 3600000).toISOString(),
      on_time_score: 0.85,
      cancellation_rate: 0.05,
      rating: 4.6,
      review_sentiment_score: 0.9,
      recent_jobs_completed: 45,
      price_range_pkr: { min: 1500, max: 4500 },
      skill_level: "expert",
      mohalla_trust_score: 0.88,
      risk_score: 0.1
    }
  },
  {
    place_id: "PKR-KHI-002",
    name: "Ali Plumbing Works DHA",
    location: { lat: 24.8020, lng: 67.0390 },
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
    place_id: "PKR-KHI-003",
    name: "Zara Beauty Salon DHA",
    location: { lat: 24.8065, lng: 67.0482 },
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
    place_id: "PKR-KHI-004",
    name: "Kashif Carpentry DHA",
    location: { lat: 24.8110, lng: 67.0400 },
    service_categories: ["CARPENTER"],
    phone: "+92-300-9998887",
    simulated_state: {
      availability: true,
      next_available_slot: new Date(Date.now() + 7200000).toISOString(),
      on_time_score: 0.65,
      cancellation_rate: 0.2,
      rating: 3.8,
      review_sentiment_score: 0.6,
      recent_jobs_completed: 15,
      price_range_pkr: { min: 1000, max: 5000 },
      skill_level: "basic",
      mohalla_trust_score: 0.6,
      risk_score: 0.4
    }
  },

  // Gulshan Karachi (approx lat: 24.9180, lng: 67.0971)
  {
    place_id: "PKR-KHI-005",
    name: "Hassan Electric & AC",
    location: { lat: 24.9190, lng: 67.0980 },
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
    place_id: "PKR-KHI-006",
    name: "Gulshan Painters",
    location: { lat: 24.9150, lng: 67.0950 },
    service_categories: ["PAINTER"],
    phone: "+92-311-4445556",
    simulated_state: {
      availability: false,
      next_available_slot: new Date(Date.now() + 172800000).toISOString(), // 2 days
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
    place_id: "PKR-KHI-007",
    name: "Siraj Maths Tutor",
    location: { lat: 24.9200, lng: 67.0990 },
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
    place_id: "PKR-KHI-008",
    name: "Faiza Bridal & Party Makeup",
    location: { lat: 24.9170, lng: 67.0940 },
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

  // G-13 Islamabad (approx lat: 33.6480, lng: 72.9830)
  {
    place_id: "PKR-ISB-001",
    name: "Capital AC Services",
    location: { lat: 33.6490, lng: 72.9840 },
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

  // F-7 Islamabad (approx lat: 33.7180, lng: 73.0550)
  {
    place_id: "PKR-ISB-004",
    name: "F-7 Elite Electric",
    location: { lat: 33.7190, lng: 73.0560 },
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

  console.log(`Starting to seed ${providers.length} providers...`);
  
  let successCount = 0;
  let failureCount = 0;

  for (const provider of providers) {
    try {
      const docRef = db.collection(PROVIDERS).doc(provider.place_id);
      await docRef.set(provider);
      console.log(`✅ Successfully seeded: ${provider.name} (${provider.place_id})`);
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
