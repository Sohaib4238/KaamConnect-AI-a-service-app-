import { providerService } from '../services/providerService.js';
// import { resolveLocation, haversineDistance } from '../data/locations.js';

// Canonical service type mapping
const SERVICE_TYPE_MAP = {
  'ac': 'AC_REPAIR',
  'plumber': 'PLUMBER',
  'electrician': 'ELECTRICIAN',
  'carpenter': 'CARPENTER',
  'beautician': 'BEAUTICIAN'
};

/**
 * Execute pure code discovery search.
 * 
 * @param {string} serviceType 
 * @param {string} locationStr 
 * @param {number} [initialRadiusKm=2.0]
 * @param {number} [expandedRadiusKm=5.0]
 * @returns {Promise<Object>}
 */
export async function runDiscoveryAgent(serviceType, locationStr, initialRadiusKm = 2.0, expandedRadiusKm = 5.0) {
  // Resolve canonical alias
  const canonicalType = SERVICE_TYPE_MAP[serviceType?.toLowerCase()] || serviceType?.toLowerCase() || 'general';
  
  // Fetch from Firestore
  const providers = await providerService.getAllProviders();

  // Filter matching service types
  let candidates = providers.filter((p) => {
    if (canonicalType === 'general') return true;
    const cats = p.service_categories || [];
    return cats.includes(canonicalType) || p.service_type === canonicalType;
  });

  // Calculate distances (Simplified for now as location resolution is deprecated)
  candidates = candidates.map((p) => ({ ...p, distance: 2.5 }));

  // Check local matches within initial radius
  const localMatches = candidates.filter((p) => (p.distance || 0) <= initialRadiusKm);

  let expandedRadiusUsed = false;
  let fallbackSuggestion = '';
  let finalResults = localMatches.slice(0, 5);

  // Edge Case A: Automatic radius expansion when 0 local results found
  if (finalResults.length === 0 && candidates.length > 0) {
    expandedRadiusUsed = true;
    const expandedMatches = candidates.filter((p) => (p.distance || 0) <= expandedRadiusKm);
    finalResults = expandedMatches.slice(0, 5);

    if (finalResults.length > 0) {
      const nearest = finalResults[0];
      const targetSec = locationStr || 'your area';
      const formattedType = canonicalType.replace(/_/g, ' ');
      fallbackSuggestion = `Abhi ${targetSec} mein koi ${formattedType} available nahi hai. Kya main ${nearest.sector || 'nearby areas'} mein dhundoon? Wahan ${nearest.distance} km door providers hain.`;
    }
  }

  if (finalResults.length === 0) {
    finalResults = candidates.slice(0, 5);
  }

  return {
    providers: finalResults,
    searchMeta: {
      serviceType: canonicalType,
      locationRequested: locationStr,
      locationResolved: false,
      locationName: locationStr || 'Islamabad',
      totalFound: finalResults.length,
      expandedRadiusUsed,
      fallbackSuggestion,
    },
  };
}

export default { runDiscoveryAgent };
