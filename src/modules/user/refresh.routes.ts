import { Router } from "express";
import { verifyRefresh, signAccess, signRefresh } from "../../utils/jwt";

const router = Router();

// Exchange refresh token for new tokens
router.post("/refresh", (req, res) => {
  try {
    const token = (req.body?.refresh as string) || (req.headers["x-refresh-token"] as string) || "";
    if (!token) return res.status(400).json({ error: "MISSING_REFRESH" });
    const payload = verifyRefresh(token) as any;
    const uid = payload._id || payload.id || payload.userId;
    if (!uid) return res.status(400).json({ error: "INVALID_REFRESH" });
    const access = signAccess({ _id: uid, username: payload.username });
    const refresh = signRefresh({ _id: uid });
    return res.json({ tokens: { access, refresh } });
  } catch {
    return res.status(401).json({ error: "INVALID_REFRESH" });
  }
});

export default router;

