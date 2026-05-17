import { Client } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});

const SERVICE_TYPE_TO_QUERY = {
  'AC_REPAIR': 'AC technician repair',
  'ELECTRICIAN': 'electrician electrical repair',
  'PLUMBER': 'plumber plumbing services',
  'CARPENTER': 'carpenter furniture repair',
  'PAINTER': 'painter painting services',
  'TUTOR': 'home tutor teacher',
  'BEAUTICIAN': 'beauty salon beautician',
  'DRIVER': 'driver cab service',
  'CLEANER': 'cleaning services',
  'GARDENER': 'gardener lawn care'
};

async function geocodeLocation(locationString) {
  try {
    const response = await mapsClient.geocode({
      params: {
        address: locationString + ', Pakistan',
        key: process.env.GOOGLE_MAPS_API_KEY,
        region: 'pk'
      }
    });
    if (response.data.results.length === 0) return null;
    const result = response.data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address
    };
  } catch (error) {
    console.error('[Maps] Geocode error:', error.message);
    return null;
  }
}

async function findNearbyProviders(lat, lng, serviceType, radiusMeters = 5000) {
  try {
    const query = SERVICE_TYPE_TO_QUERY[serviceType] || serviceType;
    const response = await mapsClient.placesNearby({
      params: {
        location: { lat, lng },
        radius: radiusMeters,
        keyword: query,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'en'
      }
    });
    return response.data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      rating: place.rating || 3.5,
      user_ratings_total: place.user_ratings_total || 0,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      business_status: place.business_status,
      source: 'google_maps'
    }));
  } catch (error) {
    console.error('[Maps] Places error:', error.message);
    return [];
  }
}

async function calculateDistance(originLat, originLng, destLat, destLng) {
  try {
    const response = await mapsClient.distancematrix({
      params: {
        origins: [{ lat: originLat, lng: originLng }],
        destinations: [{ lat: destLat, lng: destLng }],
        key: process.env.GOOGLE_MAPS_API_KEY,
        units: 'metric'
      }
    });
    const element = response.data.rows[0].elements[0];
    if (element.status !== 'OK') return null;
    return {
      distance_km: element.distance.value / 1000,
      duration_minutes: Math.ceil(element.duration.value / 60),
      distance_text: element.distance.text,
      duration_text: element.duration.text
    };
  } catch (error) {
    console.error('[Maps] Distance error:', error.message);
    return null;
  }
}

export { mapsClient, geocodeLocation, findNearbyProviders, calculateDistance };
