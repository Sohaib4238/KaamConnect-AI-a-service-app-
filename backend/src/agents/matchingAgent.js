import { logStep } from '../utils/logger.js';

// RANKING WEIGHTS — must sum to 1.0
const WEIGHTS = {
  availability:     0.20,
  on_time_score:    0.18,
  distance:         0.15,
  skill_match:      0.15,
  rating:           0.12,
  mohalla_trust:    0.10,
  cancellation:     0.06,
  price_fit:        0.04
};

function scoreProvider(provider, intent, userLat, userLng) {
  const state = provider.simulated_state || {};
  
  // 1. Availability score
  const availabilityScore = state.availability ? 1.0 : 0.0;
  
  // 2. On-time score (direct from simulated_state)
  const onTimeScore = state.on_time_score || 0.5;
  
  // 3. Distance score (inverse — closer = higher score)
  // Max useful distance: 20km = score 0, 0km = score 1.0
  const distKm = parseFloat(provider.distance_km) || 10;
  const distanceScore = distKm > 20 ? 0 : Math.max(0, 1 - (distKm / 20));
  
  // 4. Skill match score
  const skillMap = { basic: 0.5, intermediate: 0.75, expert: 1.0 };
  const skillScore = skillMap[state.skill_level] || 0.6;
  
  // 5. Rating decay score (normalize 1-5 to 0-1)
  const rating = state.rating || provider.rating || 3.5;
  const ratingScore = Math.max(0, (rating - 1) / 4);
  
  // 6. Mohalla trust score (direct)
  const mohallaScore = state.mohalla_trust_score || 0.5;
  
  // 7. Cancellation penalty (inverse — lower cancellation = higher score)
  const cancellationScore = 1 - (state.cancellation_rate || 0.1);
  
  // 8. Price fit score
  let priceFitScore = 0.5;
  if (intent.price_sensitivity && state.price_range_pkr) {
    // Lower price = better fit for price-sensitive users
    priceFitScore = Math.max(0, 1 - (state.price_range_pkr.min / 3000));
  }
  
  // Weighted total
  const totalScore = (
    WEIGHTS.availability     * availabilityScore +
    WEIGHTS.on_time_score    * onTimeScore +
    WEIGHTS.distance         * distanceScore +
    WEIGHTS.skill_match      * skillScore +
    WEIGHTS.rating           * ratingScore +
    WEIGHTS.mohalla_trust    * mohallaScore +
    WEIGHTS.cancellation     * cancellationScore +
    WEIGHTS.price_fit        * priceFitScore
  );

  return {
    ...provider,
    scores: {
      availability: availabilityScore,
      on_time: onTimeScore,
      distance: distanceScore,
      skill: skillScore,
      rating: ratingScore,
      mohalla_trust: mohallaScore,
      cancellation: cancellationScore,
      price_fit: priceFitScore
    },
    total_score: parseFloat(totalScore.toFixed(3))
  };
}

function generateReasoning(provider, allProviders, rank) {
  const state = provider.simulated_state || {};
  const distKm = parseFloat(provider.distance_km || 0).toFixed(1);
  const rating = (state.rating || 3.5).toFixed(1);
  const onTime = Math.round((state.on_time_score || 0.5) * 100);
  const trust = Math.round((state.mohalla_trust_score || 0.5) * 100);
  
  if (rank === 0) {
    const secondBest = allProviders[1];
    const reasonOverSecond = secondBest ? 
      (parseFloat(provider.distance_km) < parseFloat(secondBest.distance_km) 
        ? 'closer location'
        : 'higher on-time rate') : 'best overall score';
    
    return 'Top pick: ' + provider.name + ' (' + distKm + 'km away). ' +
      'On-time rate: ' + onTime + '%, Rating: ' + rating + '/5, ' +
      'Neighborhood trust: ' + trust + '%. ' +
      'Selected over alternatives due to ' + reasonOverSecond + '.';
  }
  
  return 'Alternative #' + rank + ': ' + provider.name + 
    ' (' + distKm + 'km). Score: ' + provider.total_score + 
    '. On-time: ' + onTime + '%, Rating: ' + rating + '/5.';
}

async function rankProviders(discoveryResult, intent, traceId = 'default') {
  const startTime = Date.now();
  const { providers, user_location } = discoveryResult;
  
  if (!providers || providers.length === 0) {
    return { top_pick: null, alternatives: [], reasoning: 'No providers found' };
  }

  // Score all providers
  const scored = providers
    .map(p => scoreProvider(p, intent, 
      user_location?.lat, user_location?.lng))
    .filter(p => p.total_score > 0) // Remove unavailable far providers
    .sort((a, b) => b.total_score - a.total_score);

  // Generate reasoning for each
  const ranked = scored.map((provider, index) => ({
    ...provider,
    rank: index + 1,
    reasoning: generateReasoning(provider, scored, index)
  }));

  const topPick = ranked[0];
  const alternatives = ranked.slice(1, 3);

  const duration = Date.now() - startTime;

  logStep(
    traceId, 3, 'ranking-agent',
    'Scoring ' + providers.length + ' providers with 6-factor algorithm',
    'Top pick: ' + topPick?.name + 
      ' (score: ' + topPick?.total_score + 
      ', distance: ' + topPick?.distance_km + 'km)',
    'Recommend ' + topPick?.name + ' as best provider',
    'Ranked ' + ranked.length + ' providers, returning top 3',
    duration
  ).catch(console.error);

  return {
    top_pick: {
      provider_id: topPick.place_id || topPick.id,
      name: topPick.name,
      score: topPick.total_score,
      distance_km: parseFloat(topPick.distance_km || 0).toFixed(2),
      rating: (topPick.simulated_state?.rating || 3.5).toFixed(1),
      available: topPick.simulated_state?.availability,
      next_slot: topPick.simulated_state?.next_available_slot,
      price_range: topPick.simulated_state?.price_range_pkr,
      phone: topPick.phone,
      location: topPick.location,
      reasoning: topPick.reasoning,
      scores_breakdown: topPick.scores
    },
    alternatives: alternatives.map(p => ({
      provider_id: p.place_id || p.id,
      name: p.name,
      score: p.total_score,
      distance_km: parseFloat(p.distance_km || 0).toFixed(2),
      rating: (p.simulated_state?.rating || 3.5).toFixed(1),
      reasoning: p.reasoning
    })),
    total_scored: ranked.length
  };
}

export { rankProviders };
