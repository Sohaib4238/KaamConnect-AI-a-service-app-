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
    const { type, sector, verified, near } = req.query;
    
    let result;
    if (type) {
      result = await providerService.getProvidersByCategory(type);
    } else if (near) {
      result = await providerService.getProvidersByLocation(near);
    } else {
      result = await providerService.getAllProviders();
    }

    if (sector) {
      result = result.filter((p) => p.sector?.toUpperCase() === sector.toUpperCase());
    }

    if (verified !== undefined) {
      result = result.filter((p) => p.verified === (verified === 'true'));
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
