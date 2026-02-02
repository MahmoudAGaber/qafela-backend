import { Router } from "express";
import mongoose from "mongoose";
import { auth } from "../../middlewares/auth";
import { IdempotencyKey } from "../core/idempotency.model";
import { rateLimit } from "../../middlewares/rateLimit";
import { z } from "zod";
import { err } from "../../utils/errors";
import { WalletTx } from "./walletTx.model";
import type { IWalletTx } from "./walletTx.model";
import { User } from "../user/user.model";
import { CurrencyRate } from "../rates/currencyRate.model";
import { CashTx } from "./cashTx.model";
import { PaymentMethod } from "./paymentMethod.model";
import type { IPaymentMethod } from "./paymentMethod.model";
import { WalletRequest } from "./walletRequest.model";
import type { IWalletRequest } from "./walletRequest.model";
import { formatWallet } from "../../utils/wallet";

const router = Router();
const topupLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const HISTORY_LIMIT = 200;

const TopupSchema = z.object({
  amount: z.number().int().positive().max(1_000_000),
});

const ExchangeSchema = z.object({
  direction: z.enum(["usd_to_qd", "qd_to_usd"]),
  amountUsdMinor: z.number().int().positive().max(10_000_000).optional(),
  amountQd: z.number().int().positive().max(100_000_000).optional(),
});

const RequestSchema = z.object({
  type: z.enum(["deposit", "withdraw"]),
  methodKey: z.string().min(1),
  amount: z.number().positive(),
  note: z.string().max(500).optional(),
});

const MethodUpsertSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["deposit", "withdraw"]),
  description: z.string().optional(),
  feeType: z.enum(["flat", "percent"]).optional(),
  feeValue: z.number().min(0).optional(),
  feeLabel: z.string().optional(),
  currency: z.enum(["QD", "USD"]).optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  processingTime: z.string().optional(),
  instant: z.boolean().optional(),
  order: z.number().int().optional(),
  icon: z.string().optional(),
  active: z.boolean().optional(),
  settings: z
    .object({
      holdOnCreate: z.boolean().optional(),
      autoApprove: z.boolean().optional(),
      feeFromWallet: z.boolean().optional(),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(["processing", "completed", "rejected", "cancelled"]),
  adminNote: z.string().max(500).optional(),
});

function isAdmin(req: any) {
  const adminKey = (req.headers["x-admin-key"] as string) || "";
  return Boolean(process.env.ADMIN_SECRET) && adminKey === process.env.ADMIN_SECRET;
}

function asMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calcFee(amount: number, method: IPaymentMethod) {
  if (!method.feeValue) return 0;
  if (method.feeType === "percent") {
    return asMoney((amount * method.feeValue) / 100);
  }
  return asMoney(method.feeValue);
}

function feeHitsWallet(method: IPaymentMethod) {
  if (method.kind === "deposit") return method.settings?.feeFromWallet === true;
  return method.settings?.feeFromWallet !== false;
}

function shouldHold(method: IPaymentMethod) {
  if (method.kind !== "withdraw") return false;
  return method.settings?.holdOnCreate !== false;
}

function autoApprove(method: IPaymentMethod) {
  if (method.kind !== "deposit") return false;
  return method.settings?.autoApprove === true;
}

function methodSnapshot(method: IPaymentMethod) {
  return {
    key: method.key,
    label: method.label,
    description: method.description,
    feeLabel: method.feeLabel,
    processingTime: method.processingTime,
    icon: method.icon,
    instant: method.instant ?? false,
  };
}

function sanitizeRequest(doc: Partial<IWalletRequest> & { _id: any }) {
  return {
    id: String(doc._id),
    type: doc.type,
    direction: doc.direction,
    status: doc.status,
    amount: doc.amount,
    feeAmount: doc.feeAmount,
    totalAmount: doc.totalAmount,
    netAmount: doc.netAmount,
    currency: doc.currency,
    method: doc.methodSnapshot,
    note: doc.note,
    adminNote: doc.adminNote,
    autoSettled: doc.autoSettled ?? false,
    holdTxId: doc.holdTxId ? String(doc.holdTxId) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    completedAt: doc.completedAt,
    cancelledAt: doc.cancelledAt,
  };
}

function fallbackTxTitle(type: string) {
  switch (type) {
    case "spend":
      return "Store purchase";
    case "reward":
      return "Reward";
    case "topup":
      return "Top up";
    case "exchange_in":
      return "Exchange in";
    case "exchange_out":
      return "Exchange out";
    case "withdraw_hold":
      return "Withdraw hold";
    case "withdraw_release":
      return "Withdraw release";
    default:
      return "Wallet update";
  }
}

function fallbackTxIcon(type: string) {
  if (type.startsWith("exchange")) return "exchange";
  if (type.startsWith("withdraw")) return "withdraw";
  if (type === "spend") return "spend";
  if (type === "reward") return "trophy";
  return "wallet";
}

function fallbackTxSubtitle(tx: IWalletTx) {
  if (tx.ref?.kind === "order") return "Drop order";
  if (tx.ref?.kind === "prize") return "Prize payout";
  if (tx.ref?.kind === "withdrawal") return "Withdrawal";
  return undefined;
}

function mapTx(tx: IWalletTx) {
  const direction = tx.meta?.direction || (tx.amountDinar >= 0 ? "in" : "out");
  return {
    kind: "transaction",
    id: String((tx as any)._id),
    type: tx.type,
    amount: tx.amountDinar,
    balanceAfter: tx.balanceAfter,
    createdAt: tx.createdAt,
    title: tx.meta?.title || fallbackTxTitle(tx.type),
    subtitle: tx.meta?.subtitle || fallbackTxSubtitle(tx),
    icon: tx.meta?.icon || fallbackTxIcon(tx.type),
    direction,
    tags: tx.meta?.tags || [],
    status: "posted",
  };
}

function mapRequest(req: IWalletRequest) {
  const snapshot = (req.methodSnapshot || {}) as any;
  const label = snapshot.label || req.methodKey;
  const baseTitle = req.type === "withdraw" ? "Withdraw request" : "Deposit request";
  return {
    kind: "request",
    id: String((req as any)._id),
    type: req.type,
    direction: req.direction,
    status: req.status,
    amount: req.amount,
    feeAmount: req.feeAmount,
    totalAmount: req.totalAmount,
    netAmount: req.netAmount,
    method: req.methodSnapshot,
    title: `${baseTitle} (${label})`,
    note: req.note,
    adminNote: req.adminNote,
    icon: req.type === "withdraw" ? "withdraw" : "topup",
    createdAt: req.createdAt,
    completedAt: req.completedAt,
    cancelledAt: req.cancelledAt,
  };
}

router.post("/topup", auth, topupLimiter, async (req, res) => {
  const parsed = TopupSchema.safeParse(req.body);
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const { amount } = parsed.data;
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const idemKey =
    (req.headers["idempotency-key"] as string) ||
    (req.headers["x-idempotency-key"] as string) ||
    undefined;
  if (idemKey) {
    const up = await IdempotencyKey.updateOne(
      { userId: uid, key: idemKey },
      { $setOnInsert: { userId: uid, key: idemKey, endpoint: "topup", createdAt: new Date() } },
      { upsert: true }
    );
    if (up.upsertedCount === 0) {
      const prior = await WalletTx.findOne({ userId: uid, idempotencyKey: idemKey, type: "topup" }).sort({
        createdAt: -1,
      });
      if (prior) {
        const userNow = await User.findById(uid).lean();
        return res.json({
          ok: true,
          wallet: { dinar: userNow?.wallet?.dinar ?? 0 },
          points: userNow?.points ?? 0,
        });
      }
      return res.status(409).json({ ok: false, error: "IDEMPOTENT_REPLAY" });
    }
  }
  const user = await User.findByIdAndUpdate(
    uid,
    { $inc: { "wallet.dinar": amount, "wallet.txCount": 1 } },
    { new: true }
  );
  if (!user) return err(res, "NOT_FOUND", 404);
  await WalletTx.create({
    userId: uid,
    type: "topup",
    amountDinar: amount,
    balanceAfter: user.wallet.dinar,
    idempotencyKey: idemKey,
    meta: { title: "Direct topup", icon: "topup", direction: "in" },
    createdAt: new Date(),
  });
  if (idemKey) await IdempotencyKey.updateOne({ userId: uid, key: idemKey }, { $set: { refKind: "topup" } });
  res.json({ ok: true, wallet: formatWallet(user.wallet), points: user.points });
});

router.post("/exchange", auth, async (req, res) => {
  const parsed = ExchangeSchema.safeParse(req.body || {});
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const { direction } = parsed.data as any;
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const envRate = Number(process.env.GC_PER_USD || "20");
  const rate = await CurrencyRate.findOne({ key: "USD_QD", active: true }).lean();
  const gcPerUsd = rate?.gcPerUsd ?? envRate;
  if (direction === "usd_to_qd") {
    const amountUsdMinor = Number((parsed.data as any).amountUsdMinor);
    const qd = Math.round((amountUsdMinor / 100) * gcPerUsd);
    const user = await User.findOneAndUpdate(
      { _id: uid, "wallet.usdMinor": { $gte: amountUsdMinor } },
      { $inc: { "wallet.usdMinor": -amountUsdMinor, "wallet.dinar": qd, "wallet.txCount": 1 } },
      { new: true }
    );
    if (!user) return err(res, "NOT_FOUND", 404);
    await CashTx.create({
      userId: uid,
      type: "exchange_out_to_gc",
      amountUsdMinor: -amountUsdMinor,
      balanceAfter: user.wallet.usdMinor,
      createdAt: new Date(),
      rateUsed: gcPerUsd,
      ref: { kind: "exchange" },
    });
    await WalletTx.create({
      userId: uid,
      type: "exchange_in",
      amountDinar: qd,
      balanceAfter: user.wallet.dinar,
      ref: { kind: "exchange" },
      meta: { title: "Cash to dinar exchange", icon: "exchange", direction: "in" },
      createdAt: new Date(),
    });
    return res.json({ ok: true, wallet: formatWallet(user.wallet), rate: { gcPerUsd } });
  } else {
    const amountQd = Number((parsed.data as any).amountQd);
    const usdMinor = Math.round((amountQd / gcPerUsd) * 100);
    const user = await User.findOneAndUpdate(
      { _id: uid, "wallet.dinar": { $gte: amountQd } },
      { $inc: { "wallet.dinar": -amountQd, "wallet.usdMinor": usdMinor, "wallet.txCount": 1 } },
      { new: true }
    );
    if (!user) return err(res, "NOT_FOUND", 404);
    await WalletTx.create({
      userId: uid,
      type: "exchange_out",
      amountDinar: -amountQd,
      balanceAfter: user.wallet.dinar,
      ref: { kind: "exchange" },
      meta: { title: "Dinar to cash exchange", icon: "exchange", direction: "out" },
      createdAt: new Date(),
    });
    await CashTx.create({
      userId: uid,
      type: "exchange_in_from_gc",
      amountUsdMinor: usdMinor,
      balanceAfter: user.wallet.usdMinor,
      createdAt: new Date(),
      rateUsed: gcPerUsd,
      ref: { kind: "exchange" },
    });
    return res.json({ ok: true, wallet: formatWallet(user.wallet), rate: { gcPerUsd } });
  }
});

router.post("/topup-usd", auth, async (req, res) => {
  if (!isAdmin(req)) return err(res, "UNAUTHORIZED", 403);
  const Schema = z.object({ amountUsdMinor: z.number().int().positive().max(10_000_000) });
  const parsed = Schema.safeParse(req.body || {});
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const user = await User.findByIdAndUpdate(
    uid,
    { $inc: { "wallet.usdMinor": parsed.data.amountUsdMinor, "wallet.txCount": 1 } },
    { new: true }
  );
  if (!user) return err(res, "NOT_FOUND", 404);
  await CashTx.create({
    userId: uid,
    type: "topup",
    amountUsdMinor: parsed.data.amountUsdMinor,
    balanceAfter: user.wallet.usdMinor,
    createdAt: new Date(),
    ref: { kind: "admin" },
  });
  res.json({ ok: true, wallet: formatWallet(user.wallet) });
});

router.get("/methods", auth, async (req, res) => {
  const kind = req.query.kind === "deposit" || req.query.kind === "withdraw" ? (req.query.kind as string) : undefined;
  const filter: any = { active: true };
  if (kind) filter.kind = kind;
  const methods = await PaymentMethod.find(filter).sort({ order: 1, label: 1 }).lean();
  res.json({
    methods: methods.map((m) => ({
      key: m.key,
      label: m.label,
      kind: m.kind,
      description: m.description,
      feeType: m.feeType,
      feeValue: m.feeValue,
      feeLabel: m.feeLabel,
      currency: m.currency,
      minAmount: m.minAmount,
      maxAmount: m.maxAmount,
      processingTime: m.processingTime,
      instant: m.instant ?? false,
      icon: m.icon,
      settings: m.settings || {},
      metadata: m.metadata || {},
    })),
  });
});

router.post("/methods/upsert", async (req, res) => {
  if (!isAdmin(req)) return err(res, "UNAUTHORIZED", 403);
  const parsed = MethodUpsertSchema.safeParse(req.body || {});
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const payload = parsed.data;
  await PaymentMethod.updateOne(
    { key: payload.key },
    {
      $set: {
        label: payload.label,
        kind: payload.kind,
        description: payload.description,
        feeType: payload.feeType ?? "flat",
        feeValue: payload.feeValue ?? 0,
        feeLabel: payload.feeLabel,
        currency: payload.currency ?? "QD",
        minAmount: payload.minAmount,
        maxAmount: payload.maxAmount,
        processingTime: payload.processingTime,
        instant: payload.instant ?? false,
        order: payload.order ?? 0,
        icon: payload.icon,
        active: payload.active ?? true,
        settings: payload.settings ?? {},
        metadata: payload.metadata ?? {},
      },
      $setOnInsert: { key: payload.key },
    },
    { upsert: true }
  );
  const method = await PaymentMethod.findOne({ key: payload.key }).lean();
  res.json({ ok: true, method });
});

router.post("/requests", auth, async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body || {});
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const { type, methodKey, amount, note } = parsed.data;
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const method = await PaymentMethod.findOne({ key: methodKey, kind: type, active: true }).lean();
  if (!method) return err(res, "METHOD_NOT_AVAILABLE", 400);
  if (method.minAmount && amount < method.minAmount) return err(res, "AMOUNT_TOO_LOW", 400);
  if (method.maxAmount && amount > method.maxAmount) return err(res, "AMOUNT_TOO_HIGH", 400);
  const fee = calcFee(amount, method);
  const feeOnWallet = feeHitsWallet(method);
  const holdFunds = shouldHold(method);
  const autoSettle = autoApprove(method);
  const snapshot = methodSnapshot(method);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let holdTxId: mongoose.Types.ObjectId | undefined;
    if (type === "withdraw" && holdFunds) {
      const debit = amount + (feeOnWallet ? fee : 0);
      const updated = await User.findOneAndUpdate(
        { _id: uid, "wallet.dinar": { $gte: debit } },
        { $inc: { "wallet.dinar": -debit, "wallet.txCount": 1 } },
        { new: true, session }
      );
      if (!updated) throw new Error("NOT_ENOUGH_FUNDS");
      const [tx] = await WalletTx.create(
        [
          {
            userId: uid,
            type: "withdraw_hold",
            amountDinar: -debit,
            balanceAfter: updated.wallet.dinar,
            ref: { kind: "withdrawal" },
            meta: {
              title: `Withdraw request (${snapshot.label})`,
              icon: "withdraw",
              direction: "out",
              methodKey: method.key,
            },
            createdAt: new Date(),
          },
        ],
        { session }
      );
      holdTxId = tx._id;
    }
    let status: IWalletRequest["status"] = "pending";
    let completedAt: Date | undefined;
    if (type === "deposit" && autoSettle) {
      const credit = amount - (feeOnWallet ? fee : 0);
      if (credit <= 0) throw new Error("INVALID_FEE");
      const updated = await User.findByIdAndUpdate(
        uid,
        { $inc: { "wallet.dinar": credit, "wallet.txCount": 1 } },
        { new: true, session }
      );
      await WalletTx.create(
        [
          {
            userId: uid,
            type: "topup",
            amountDinar: credit,
            balanceAfter: updated?.wallet?.dinar ?? 0,
            ref: { kind: "withdrawal" },
            meta: {
              title: `Deposit via ${snapshot.label}`,
              icon: "topup",
              direction: "in",
              methodKey: method.key,
            },
            createdAt: new Date(),
          },
        ],
        { session }
      );
      status = "completed";
      completedAt = new Date();
    }
    const totalAmount = type === "withdraw" ? amount + (feeOnWallet ? fee : 0) : amount;
    const netAmount =
      type === "withdraw" ? -totalAmount : amount - (feeOnWallet ? fee : 0);
    const [requestDoc] = await WalletRequest.create(
      [
        {
          userId: uid,
          type,
          direction: type === "withdraw" ? "out" : "in",
          methodKey: method.key,
          methodSnapshot: snapshot,
          amount,
          feeAmount: fee,
          totalAmount,
          netAmount: asMoney(netAmount),
          currency: method.currency ?? "QD",
          status,
          note,
          autoSettled: status === "completed",
          completedAt,
          holdTxId,
        },
      ],
      { session }
    );
    await session.commitTransaction();
    session.endSession();
    return res.json({ ok: true, request: sanitizeRequest(requestDoc) });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    if (e?.message === "NOT_ENOUGH_FUNDS") return err(res, "NOT_ENOUGH_FUNDS", 400);
    return err(res, "REQUEST_FAILED", 400);
  }
});

router.get("/requests", auth, async (req, res) => {
  const limit = Math.min(HISTORY_LIMIT, Math.max(1, Number(req.query.limit ?? 50)));
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const rows = await WalletRequest.find({ userId: uid })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  res.json({ requests: rows.map((r) => sanitizeRequest(r as any)) });
});

router.post("/requests/:id/cancel", auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const request = await WalletRequest.findOne({ _id: req.params.id, userId: uid });
  if (!request) return err(res, "NOT_FOUND", 404);
  if (!["pending", "processing"].includes(request.status)) return err(res, "INVALID_STATE", 400);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (request.type === "withdraw" && request.holdTxId) {
      const releaseAmount = request.totalAmount;
      const updated = await User.findByIdAndUpdate(
        uid,
        { $inc: { "wallet.dinar": releaseAmount, "wallet.txCount": 1 } },
        { new: true, session }
      );
      await WalletTx.create(
        [
          {
            userId: uid,
            type: "withdraw_release",
            amountDinar: releaseAmount,
            balanceAfter: updated?.wallet?.dinar ?? 0,
            ref: { kind: "withdrawal" },
            meta: {
              title: "Withdraw request cancelled",
              icon: "withdraw",
              direction: "in",
              methodKey: request.methodKey,
            },
            createdAt: new Date(),
          },
        ],
        { session }
      );
    }
    request.status = "cancelled";
    request.cancelledAt = new Date();
    await request.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ ok: true, request: sanitizeRequest(request as any) });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return err(res, "REQUEST_FAILED", 400);
  }
});

router.post("/requests/:id/status", async (req, res) => {
  if (!isAdmin(req)) return err(res, "UNAUTHORIZED", 403);
  const parsed = UpdateStatusSchema.safeParse(req.body || {});
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const request = await WalletRequest.findById(req.params.id);
  if (!request) return err(res, "NOT_FOUND", 404);
  if (request.status === "cancelled" || request.status === "rejected") return err(res, "INVALID_STATE", 400);
  const uid = request.userId;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const nextStatus = parsed.data.status;
    if (nextStatus === "processing" && request.status === "pending") {
      request.status = "processing";
    } else if (nextStatus === "completed") {
      if (request.type === "deposit" && !request.autoSettled) {
        const credit = request.netAmount;
        const updated = await User.findByIdAndUpdate(
          uid,
          { $inc: { "wallet.dinar": credit, "wallet.txCount": 1 } },
          { new: true, session }
        );
        await WalletTx.create(
          [
            {
              userId: uid,
              type: "topup",
              amountDinar: credit,
              balanceAfter: updated?.wallet?.dinar ?? 0,
              ref: { kind: "withdrawal" },
              meta: {
                title: `Deposit via ${((request.methodSnapshot || {}) as any).label || request.methodKey}`,
                icon: "topup",
                direction: "in",
                methodKey: request.methodKey,
              },
              createdAt: new Date(),
            },
          ],
          { session }
        );
        request.autoSettled = true;
      } else if (request.type === "withdraw" && !request.holdTxId) {
        const debit = Math.abs(request.netAmount);
        const updated = await User.findOneAndUpdate(
          { _id: uid, "wallet.dinar": { $gte: debit } },
          { $inc: { "wallet.dinar": -debit, "wallet.txCount": 1 } },
          { new: true, session }
        );
        if (!updated) throw new Error("NOT_ENOUGH_FUNDS");
        const [tx] = await WalletTx.create(
          [
            {
              userId: uid,
              type: "withdraw_hold",
              amountDinar: -debit,
              balanceAfter: updated.wallet.dinar,
              ref: { kind: "withdrawal" },
              meta: {
                title: `Withdraw request (${((request.methodSnapshot || {}) as any).label || request.methodKey})`,
                icon: "withdraw",
                direction: "out",
                methodKey: request.methodKey,
              },
              createdAt: new Date(),
            },
          ],
          { session }
        );
        request.holdTxId = tx._id;
      }
      request.status = "completed";
      request.completedAt = new Date();
    } else if (nextStatus === "rejected" || nextStatus === "cancelled") {
      if (request.type === "withdraw" && request.holdTxId) {
        const releaseAmount = request.totalAmount;
        const updated = await User.findByIdAndUpdate(
          uid,
          { $inc: { "wallet.dinar": releaseAmount, "wallet.txCount": 1 } },
          { new: true, session }
        );
        await WalletTx.create(
          [
            {
              userId: uid,
              type: "withdraw_release",
              amountDinar: releaseAmount,
              balanceAfter: updated?.wallet?.dinar ?? 0,
              ref: { kind: "withdrawal" },
              meta: {
                title: "Withdraw request released",
                icon: "withdraw",
                direction: "in",
                methodKey: request.methodKey,
              },
              createdAt: new Date(),
            },
          ],
          { session }
        );
      }
      request.status = nextStatus;
      request.cancelledAt = new Date();
    } else {
      request.status = nextStatus;
    }
    request.adminNote = parsed.data.adminNote;
    await request.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ ok: true, request: sanitizeRequest(request as any) });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    if (e?.message === "NOT_ENOUGH_FUNDS") return err(res, "NOT_ENOUGH_FUNDS", 400);
    return err(res, "REQUEST_FAILED", 400);
  }
});

router.get("/timeline", auth, async (req, res) => {
  const limit = Math.min(HISTORY_LIMIT, Math.max(1, Number(req.query.limit ?? 50)));
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const [txRows, requestRows] = await Promise.all([
    WalletTx.find({ userId: uid }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean(),
    WalletRequest.find({ userId: uid }).sort({ createdAt: -1, _id: -1 }).limit(limit).lean(),
  ]);
  const combined = [
    ...txRows.map((tx) => mapTx(tx as any)),
    ...requestRows.map((rq) => mapRequest(rq as any)),
  ].sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
  res.json({ items: combined.slice(0, limit) });
});

router.get("/history/game", auth, async (req, res) => {
  const limit = Math.min(HISTORY_LIMIT, Math.max(1, Number(req.query.limit ?? 50)));
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const rows = await WalletTx.find({ userId: uid })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  res.json({ items: rows.map((tx) => mapTx(tx as any)) });
});

router.get("/history/cash", auth, async (req, res) => {
  const limit = Math.min(HISTORY_LIMIT, Math.max(1, Number(req.query.limit ?? 50)));
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const rows = await CashTx.find({ userId: uid })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  const items = rows.map((r) => ({
    type: r.type,
    amountUsdMinor: r.amountUsdMinor,
    balanceAfter: r.balanceAfter,
    rateUsed: r.rateUsed ?? null,
    createdAt: r.createdAt,
    ref: r.ref || null,
  }));
  res.json({ items });
});

export default router;
