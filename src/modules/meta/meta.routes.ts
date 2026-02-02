import { Router } from 'express';
import { CurrencyRate } from '../rates/currencyRate.model';
import { err } from '../../utils/errors';

const router = Router();

router.get('/meta/currency', async (_req, res) => {
  const envRate = Number(process.env.GC_PER_USD || '20');
  const rate = await CurrencyRate.findOne({ key: 'USD_QD', active: true }).lean();
  const gcPerUsd = rate?.gcPerUsd ?? envRate;
  const usdPerGc = rate?.usdPerGc ?? (1 / gcPerUsd);
  res.json({ code: 'QD', gcPerUsd, usdPerGc });
});

// Alias endpoint for rates
router.get('/rates/current', async (_req, res) => {
  const envRate = Number(process.env.GC_PER_USD || '20');
  const rate = await CurrencyRate.findOne({ key: 'USD_QD', active: true }).lean();
  const gcPerUsd = rate?.gcPerUsd ?? envRate;
  const usdPerGc = rate?.usdPerGc ?? (1 / gcPerUsd);
  res.json({ gcPerUsd, usdPerGc, code: 'QD' });
});

// Admin: upsert rate
router.post('/rates/upsert', async (req, res) => {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  if (!process.env.ADMIN_SECRET || adminKey !== process.env.ADMIN_SECRET) return err(res, 'UNAUTHORIZED', 403);
  const { gcPerUsd, usdPerGc } = req.body || {};
  if (typeof gcPerUsd !== 'number' && typeof usdPerGc !== 'number') return err(res, 'INVALID_INPUT', 400);
  const g = typeof gcPerUsd === 'number' ? gcPerUsd : (1 / Number(usdPerGc));
  const u = typeof usdPerGc === 'number' ? usdPerGc : (1 / Number(gcPerUsd));
  await CurrencyRate.updateOne(
    { key: 'USD_QD' },
    { $set: { gcPerUsd: g, usdPerGc: u, active: true } , $setOnInsert: { key: 'USD_QD' } },
    { upsert: true }
  );
  const rate = await CurrencyRate.findOne({ key: 'USD_QD' }).lean();
  res.json({ ok: true, rate });
});

export default router;
