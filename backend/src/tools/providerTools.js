/**
 * KaamConnect — Provider Discovery & Search Tools
 * 
 * Pure code functions (no LLM) for searching, filtering,
 * and ranking service providers from the mock dataset.
 */

import { providers, SERVICE_TYPE_MAP } from '../data/providers.js';
import { resolveLocation, haversineDistance } from '../data/locations.js';

/**
 * Search providers by service type and location.
 * 
 * @param {string} serviceType - Canonical or alias service type
 * @param {string} locationStr - User's location string (e.g., "G-13")
 * @param {number} [maxResults=10] - Maximum results to return
 * @returns {{ providers: Array, location: Object, searchMeta: Object }}
 */
export function searchProviders(serviceType, locationStr, maxResults = 10) {
  // Resolve service type alias
  const canonicalType = SERVICE_TYPE_MAP[serviceType?.toLowerCase()] || serviceType?.toLowerCase();

  // Resolve location
  const location = resolveLocation(locationStr);

  // Filter by service type
  let filtered = providers.filter((p) => {
    if (!canonicalType) return true;
    return p.serviceType === canonicalType;
  });

  // Calculate distance if location is available
  if (location) {
    filtered = filtered.map((p) => ({
      ...p,
      distance: haversineDistance(location.lat, location.lng, p.lat, p.lng),
    }));
  }

  return {
    providers: filtered.slice(0, maxResults),
    location,
    searchMeta: {
      totalFound: filtered.length,
      serviceType: canonicalType,
      locationResolved: !!location,
      locationName: location?.name || locationStr,
    },
  };
}

/**
 * Rank providers using weighted scoring algorithm.
 * 
 * Scoring weights:
 * - Proximity: 40% (closer = higher score)
 * - Rating: 30% (higher = higher score) 
 * - Availability: 15% (available now = bonus)
 * - Verified: 10% (verified = bonus)
 * - Experience: 5% (more years = higher score)
 * 
 * @param {Array} providerList - List of providers with distance
 * @param {string} [timePreference] - Preferred time (e.g., "morning", "evening")
 * @returns {{ ranked: Array, reasoning: string }}
 */
export function rankProviders(providerList, timePreference) {
  if (!providerList || providerList.length === 0) {
    return { ranked: [], reasoning: 'No providers found for this search criteria.' };
  }

  // Find max distance for normalization
  const maxDistance = Math.max(...providerList.map((p) => p.distance || 0), 1);
  const maxRating = 5;
  const maxExp = Math.max(...providerList.map((p) => p.yearsExp || 0), 1);

  const scored = providerList.map((provider) => {
    // Proximity score (0-1, closer = higher)
    const proximityScore = provider.distance != null 
      ? 1 - (provider.distance / maxDistance) 
      : 0.5;

    // Rating score (0-1)
    const ratingScore = (provider.rating || 0) / maxRating;

    // Availability score (0 or 1)
    const availabilityScore = checkAvailability(provider.availability, timePreference) ? 1 : 0.3;

    // Verified bonus
    const verifiedScore = provider.verified ? 1 : 0.5;

    // Experience score (0-1)
    const experienceScore = (provider.yearsExp || 0) / maxExp;

    // Weighted total
    const totalScore =
      proximityScore * 0.40 +
      ratingScore * 0.30 +
      availabilityScore * 0.15 +
      verifiedScore * 0.10 +
      experienceScore * 0.05;

    return {
      ...provider,
      scores: {
        proximity: Math.round(proximityScore * 100),
        rating: Math.round(ratingScore * 100),
        availability: Math.round(availabilityScore * 100),
        verified: Math.round(verifiedScore * 100),
        experience: Math.round(experienceScore * 100),
        total: Math.round(totalScore * 100),
      },
    };
  });

  // Sort by total score descending
  scored.sort((a, b) => b.scores.total - a.scores.total);

  // Generate reasoning for top pick
  const top = scored[0];
  const reasoning = generateRankingReasoning(top, scored);

  return { ranked: scored, reasoning };
}

/**
 * Generate a human-readable reasoning explanation for the ranking.
 */
function generateRankingReasoning(topProvider, allRanked) {
  const parts = [];

  parts.push(`Selected "${topProvider.name}" as the best match (score: ${topProvider.scores.total}/100).`);

  if (topProvider.distance != null) {
    parts.push(`Distance: ${topProvider.distance} km from your location.`);
  }

  parts.push(`Rating: ${topProvider.rating}/5 (${topProvider.reviews} reviews).`);

  if (topProvider.verified) {
    parts.push('This provider is verified ✓.');
  }

  parts.push(`Experience: ${topProvider.yearsExp} years in the field.`);
  parts.push(`Hourly rate: PKR ${topProvider.hourlyRate}.`);

  if (allRanked.length > 1) {
    parts.push(`Compared against ${allRanked.length - 1} other provider(s) in the area.`);
  }

  return parts.join(' ');
}

/**
 * Check if a provider is available at the given time preference.
 * 
 * @param {Object} availability - Provider's availability schedule
 * @param {string} [timePreference] - "morning", "afternoon", "evening"
 * @returns {boolean}
 */
function checkAvailability(availability, timePreference) {
  if (!availability) return true; // Assume available if no schedule

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const isSunday = dayOfWeek === 0;

  // Check if they work on Sunday
  if (isSunday && availability['Sun'] === 'Off') return false;

  // If time preference given, check rough time slots
  if (timePreference) {
    const pref = timePreference.toLowerCase();
    // Morning: 7-12, Afternoon: 12-17, Evening: 17-22
    if (pref.includes('morning') || pref.includes('subah')) {
      return true; // Most providers cover morning hours
    }
    if (pref.includes('evening') || pref.includes('shaam')) {
      // Check if schedule extends to evening
      const schedules = Object.values(availability);
      return schedules.some((s) => {
        if (typeof s !== 'string') return false;
        const endHour = parseInt(s.split('-')[1]?.split(':')[0] || '0');
        return endHour >= 18;
      });
    }
  }

  return true;
}

export default { searchProviders, rankProviders };
