import axios from 'axios';

// For Expo Go on physical device — use your machine's local IP
// For emulator — use 10.0.2.2:3000
const DEFAULT_URL = 'http://192.168.1.40:3000';
let BASE_URL = DEFAULT_URL;

export const getDefaultApiUrl = () => DEFAULT_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Stage 1: Discover providers (intent + discovery + ranking, NO booking)
export const discoverProviders = async (message, userLocation = null) => {
  const response = await api.post('/api/discover', {
    message,
    user_lat: userLocation?.lat || null,
    user_lng: userLocation?.lng || null
  });
  return response.data;
};

// Stage 2: Book a specific chosen provider
export const bookProvider = async (provider, intent, traceId, userId = 'mobile-user') => {
  const response = await api.post('/api/book', {
    provider, intent, trace_id: traceId, user_id: userId,
  });
  return response.data;
};

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  const response = await api.post(`/api/bookings/${bookingId}/cancel`);
  return response.data;
};

// Complete a booking
export const completeBooking = async (bookingId) => {
  const response = await api.post(`/api/bookings/${bookingId}/complete`);
  return response.data;
};

// Fetch bookings via backend API (avoids Firebase Web SDK issues)
export const getBookings = async () => {
  const response = await api.get('/api/bookings');
  return response.data;
};

// Fetch traces via backend API
export const getTraces = async () => {
  const response = await api.get('/api/traces');
  return response.data;
};

// Legacy: full pipeline in one shot
export const orchestrate = async (message, userId = 'mobile-user') => {
  const response = await api.post('/api/orchestrate', { message, user_id: userId });
  return response.data;
};

export const testIntent = async (message) => {
  const response = await api.post('/api/test-intent', { message });
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
