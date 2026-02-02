import { Router } from 'express';
import mongoose from 'mongoose';
import { auth } from '../../middlewares/auth';
import { WinnerPayout } from './winnerPayout.model';
import { err } from '../../utils/errors';
import { CurrencyRate } from '../rates/currencyRate.model';
import { User } from '../user/user.model';
import { z } from 'zod';
import { WalletTx } from '../wallet/walletTx.model';

const router = Router();

router.get('/my', auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const payouts = await WinnerPayout.find({ userId: uid }).sort({ createdAt: -1 }).lean();
  const envRate = Number(process.env.GC_PER_USD || '20');
  const rate = await CurrencyRate.findOne({ key: 'USD_QD', active: true }).lean();
  const gcPerUsd = rate?.gcPerUsd ?? envRate;
  const list = payouts.map(p => ({
    id: p._id,
    title: p.title,
    amount: Math.round((p.amountMinor / 100) * gcPerUsd),
    status: p.status,
    date: p.createdAt,
    description: p.description || '',
    currency: 'QD',
    amountUsd: Math.round(p.amountMinor) / 100,
  }));
  res.json({ rewards: list });
});

router.post('/:id/claim', auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const id = req.params.id;
  const Schema = z.object({ mode: z.enum(['withdraw','to_game']).optional() });
  const parsed = Schema.safeParse(req.body || {});
  const payout = await WinnerPayout.findOne({ _id: id, userId: uid });
  if (!payout) return err(res, 'NOT_FOUND', 404);
  if (payout.status !== 'available') return err(res, 'INVALID_INPUT', 400);
  const mode = parsed.success ? parsed.data.mode : 'withdraw';
  if (mode === 'to_game') {
    // convert USD -> QD and credit game wallet
    const envRate = Number(process.env.GC_PER_USD || '20');
    const rate = await CurrencyRate.findOne({ key: 'USD_QD', active: true }).lean();
    const gcPerUsd = rate?.gcPerUsd ?? envRate;
    const qd = Math.round((payout.amountMinor / 100) * gcPerUsd);
    const user = await User.findByIdAndUpdate(uid, { $inc: { 'wallet.dinar': qd } }, { new: true });
    await WalletTx.create({
      userId: uid,
      type: 'reward',
      amountDinar: qd,
      balanceAfter: user?.wallet?.dinar ?? 0,
      ref: { kind: 'prize' },
      meta: { title: payout.title || 'Prize', icon: 'trophy', direction: 'in' },
      createdAt: new Date()
    });
    payout.status = 'claimed';
    payout.paidAt = new Date();
    payout.claimedAt = new Date();
    await payout.save();
    return res.json({ ok: true, wallet: { dinar: user?.wallet?.dinar ?? 0 } });
  } else {
    // withdraw: mark as pending for external payout
    payout.status = 'pending';
    payout.claimedAt = new Date();
    await payout.save();
    return res.json({ ok: true });
  }
});

router.post('/claim-all', auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const r = await WinnerPayout.updateMany({ userId: uid, status: 'available' }, { $set: { status: 'pending', claimedAt: new Date() } });
  res.json({ ok: true, updated: r.modifiedCount });
});

export default router;
