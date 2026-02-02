import { Router } from "express";
import mongoose from "mongoose";
import { auth } from "../../middlewares/auth";
import { Inventory } from "./inventory.model";
import { z } from "zod";
import { err } from "../../utils/errors";

const router = Router();

router.get("/my", auth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const inv = await Inventory.findOne({ userId: uid }).lean();
  res.json({ inventory: inv ?? { userId: uid, items: [] } });
});

router.post("/use", auth, async (req, res) => {
  const UseSchema = z.object({ itemId: z.string().min(1), qty: z.number().int().positive().max(100) });
  const parsed = UseSchema.safeParse(req.body);
  if (!parsed.success) return err(res, "INVALID_INPUT", 400);
  const { itemId, qty } = parsed.data;

  const uid = new mongoose.Types.ObjectId((req as any).user._id);
  const itemObjectId = new mongoose.Types.ObjectId(itemId);

  const r = await Inventory.updateOne(
    { userId: uid, "items.itemId": itemObjectId, "items.qty": { $gte: qty } },
    { $inc: { "items.$.qty": -qty } }
  );

  if (r.modifiedCount === 0) return err(res, "NOT_ENOUGH_QTY", 400);
  res.json({ ok: true });
});

export default router;
