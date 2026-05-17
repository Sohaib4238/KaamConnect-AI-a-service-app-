import { Router } from 'express';
import { providerService } from '../services/providerService.js';

const router = Router();

/**
 * GET /api/providers
 * List all providers. Supports query filters:
 *   - type: Filter by service type
 *   - sector: Filter by sector
 *   - verified: Filter by verified status (true/false)
 */
router.get('/', async (req, res) => {
  try {
    const { type, sector, verified, near, category, search } = req.query;
    
    let result = await providerService.getAllProviders();

    const targetCategory = category || type;
    if (targetCategory && targetCategory !== 'ALL') {
      result = result.filter(p => p.service_categories?.includes(targetCategory));
    }

    if (near) {
      const hint = near.toLowerCase();
      result = result.filter(p => {
        const loc = JSON.stringify(p.location || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return loc.includes(hint) || name.includes(hint);
      });
    }

    if (sector) {
      result = result.filter((p) => p.sector?.toUpperCase() === sector.toUpperCase());
    }

    if (verified !== undefined) {
      result = result.filter((p) => p.verified === (verified === 'true'));
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(s) ||
        p.service_categories?.some(c => c.toLowerCase().includes(s))
      );
    }

    res.json({
      success: true,
      count: result.length,
      providers: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/:id
 * Get a specific provider by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const provider = await providerService.getProviderById(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    res.json({ success: true, provider });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
