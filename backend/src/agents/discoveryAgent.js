import { geocodeLocation, findNearbyProviders, calculateDistance } 
  from '../config/maps.js';
import { providerService } from '../services/providerService.js';
import { logStep } from '../utils/logger.js';

const SERVICE_TYPE_MAP = {
  'ac_repair': 'AC_REPAIR',
  'ac': 'AC_REPAIR',
  'ac repair': 'AC_REPAIR',
  'ac wala': 'AC_REPAIR',
  'ac technician': 'AC_REPAIR',
  'ac chahye': 'AC_REPAIR',
  'ac masla': 'AC_REPAIR',
  'electrician': 'ELECTRICIAN',
  'bijli': 'ELECTRICIAN',
  'bijli wala': 'ELECTRICIAN',
  'plumber': 'PLUMBER',
  'naali': 'PLUMBER',
  'nalka': 'PLUMBER',
  'carpenter': 'CARPENTER',
  'bardha': 'CARPENTER',
  'lakri': 'CARPENTER',
  'painter': 'PAINTER',
  'rang': 'PAINTER',
  'paint': 'PAINTER',
  'tutor': 'TUTOR',
  'teacher': 'TUTOR',
  'ustad': 'TUTOR',
  'beautician': 'BEAUTICIAN',
  'makeup': 'BEAUTICIAN',
  'driver': 'DRIVER',
  'cleaner': 'CLEANER',
  'gardener': 'GARDENER'
};

function normalizeServiceType(serviceType) {
  if (!serviceType || typeof serviceType !== 'string') return 'AC_REPAIR';
  const cleaned = serviceType.toLowerCase().trim();
  
  if (SERVICE_TYPE_MAP[cleaned]) {
    return SERVICE_TYPE_MAP[cleaned];
  }
  
  for (const [key, value] of Object.entries(SERVICE_TYPE_MAP)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }
  
  const upper = cleaned.toUpperCase();
  const validCategories = ['AC_REPAIR', 'ELECTRICIAN', 'PLUMBER', 'CARPENTER', 'PAINTER', 'TUTOR', 'BEAUTICIAN', 'DRIVER', 'CLEANER', 'GARDENER'];
  if (validCategories.includes(upper)) {
    return upper;
  }
  
  return 'AC_REPAIR';
}

async function discoverProviders(intent, traceId = 'default') {
  const startTime = Date.now();
  const service_type = normalizeServiceType(intent.service_type);
  const { location } = intent;

  console.log('[Discovery] Starting for:', service_type, 'in', location);

  // Step 1: Determine user location — GPS > Geocode > Default
  let userLat = 33.6844; // Default: Islamabad
  let userLng = 73.0479;
  let geocodedAddress = location || 'Current Location';

  if (intent.gps_lat && intent.gps_lng) {
    // Use GPS coordinates directly — most accurate (like Uber)
    userLat = intent.gps_lat;
    userLng = intent.gps_lng;
    console.log('[Discovery] Using GPS coordinates:', userLat, userLng);
    // Still try to geocode for display name if location text exists
    if (location) {
      const geocoded = await geocodeLocation(location);
      if (geocoded) {
        geocodedAddress = geocoded.formatted_address + ' (GPS verified)';
      } else {
        geocodedAddress = location + ' (GPS verified)';
      }
    } else {
      geocodedAddress = 'Your current location (GPS)';
    }
  } else if (location) {
    // Fall back to geocoding the location string
    const geocoded = await geocodeLocation(location);
    if (geocoded) {
      userLat = geocoded.lat;
      userLng = geocoded.lng;
      geocodedAddress = geocoded.formatted_address;
      console.log('[Discovery] Geocoded:', geocodedAddress);
    } else {
      console.log('[Discovery] Geocode failed, using default location');
    }
  } else {
    console.log('[Discovery] No location info, using default Islamabad');
  }

  // Step 2 & 3: Parallelize Maps API and Firestore
  let mapsProviders = [];
  let firestoreProviders = [];
  
  const [mapsResult, firestoreResult] = await Promise.allSettled([
    findNearbyProviders(userLat, userLng, service_type),
    providerService.getProvidersByCategory(service_type)
  ]);

  if (mapsResult.status === 'fulfilled') {
    mapsProviders = mapsResult.value;
    console.log('[Discovery] Maps returned:', mapsProviders.length, 'providers');
  } else {
    console.log('[Discovery] Maps search failed, using Firestore only');
  }

  if (firestoreResult.status === 'fulfilled') {
    firestoreProviders = firestoreResult.value;
    console.log('[Discovery] Firestore returned:', firestoreProviders.length, 'providers');
  } else {
    console.log('[Discovery] Firestore search failed');
  }

  // Step 4: Add distance to Firestore providers
  const firestoreWithDistance = firestoreProviders.map((provider) => {
    const provLat = provider.location?.lat || userLat;
    const provLng = provider.location?.lng || userLng;
    const distance_km = calculateStraightDistance(
      userLat, userLng, provLat, provLng
    );
    return {
      ...provider,
      distance_km,
      duration_minutes: Math.ceil(distance_km * 3),
      source: 'firestore'
    };
  });

  // Step 4b: Filter by distance — only show providers within 50km
  let filteredProviders = firestoreWithDistance.filter(p => p.distance_km <= 50);

  if (filteredProviders.length === 0) {
    // Expand to 100km
    filteredProviders = firestoreWithDistance.filter(p => p.distance_km <= 100);
  }

  if (filteredProviders.length === 0) {
    // Last resort — return closest 3 regardless of distance
    filteredProviders = [...firestoreWithDistance]
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 3);
  }

  console.log('[Discovery] Distance filter:', firestoreWithDistance.length, '→', filteredProviders.length, 'providers within range');

  // Step 5: Merge results — filtered Firestore providers first
  const allProviders = [
    ...filteredProviders,
    ...mapsProviders.slice(0, 5).map(p => ({
      ...p,
      distance_km: calculateStraightDistance(
        userLat, userLng, p.location.lat, p.location.lng
      ),
      simulated_state: generateSimulatedState()
    }))
  ];

  const duration = Date.now() - startTime;

  logStep(
    traceId, 2, 'discovery-agent',
    'Searching for ' + service_type + ' near ' + location,
    'Found ' + mapsProviders.length + ' from Maps, ' + 
      firestoreProviders.length + ' from Firestore',
    'Merge and pass to ranking agent',
    'Returning ' + allProviders.length + ' total providers',
    duration
  ).catch(console.error);

  return {
    providers: allProviders,
    user_location: { lat: userLat, lng: userLng },
    geocoded_address: geocodedAddress,
    total_found: allProviders.length
  };
}

// Haversine formula for straight-line distance fallback
function calculateStraightDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Generate simulated state for Maps API providers that don't have one
function generateSimulatedState() {
  return {
    availability: Math.random() > 0.3,
    next_available_slot: new Date(Date.now() + 
      Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    on_time_score: 0.7 + Math.random() * 0.3,
    cancellation_rate: Math.random() * 0.15,
    rating: 3.5 + Math.random() * 1.5,
    review_sentiment_score: 0.6 + Math.random() * 0.4,
    recent_jobs_completed: Math.floor(Math.random() * 20),
    price_range_pkr: { min: 500, max: 3000 },
    skill_level: ['basic', 'intermediate', 'expert'][Math.floor(Math.random() * 3)],
    mohalla_trust_score: 0.5 + Math.random() * 0.5,
    risk_score: Math.random() * 0.3
  };
}

export { discoverProviders };

export async function runDiscoveryAgent(service_type, location) {
  const intent = { service_type, location };
  const res = await discoverProviders(intent);
  return {
    providers: res.providers,
    searchMeta: {
      locationName: res.geocoded_address,
      expandedRadiusUsed: res.total_found === 0,
      fallbackSuggestion: null
    }
  };
}
