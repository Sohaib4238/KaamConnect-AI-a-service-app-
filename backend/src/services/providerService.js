import { db } from '../config/firebase.js';

const PROVIDERS_COLLECTION = 'providers';

export const providerService = {

  // Get all providers
  async getAllProviders() {
    const snapshot = await db.collection(PROVIDERS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get providers by service category
  async getProvidersByCategory(serviceCategory) {
    const snapshot = await db.collection(PROVIDERS_COLLECTION)
      .where('service_categories', 'array-contains', serviceCategory)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get single provider by ID
  async getProviderById(providerId) {
    const doc = await db.collection(PROVIDERS_COLLECTION).doc(providerId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  // Update provider simulated state
  async updateProviderState(providerId, stateUpdates) {
    await db.collection(PROVIDERS_COLLECTION).doc(providerId).update({
      'simulated_state': stateUpdates,
      'updated_at': new Date().toISOString()
    });
  },

  // Get providers near a location (by city prefix match for now)
  async getProvidersByLocation(locationHint) {
    const all = await this.getAllProviders();
    const hint = locationHint.toLowerCase();
    return all.filter(p => {
      const loc = JSON.stringify(p.location || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return loc.includes(hint) || name.includes(hint);
    });
  }
};

export default providerService;
