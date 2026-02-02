import { Request, Response, NextFunction } from "express";

type Key = string;
interface Counter { count: number; resetAt: number }

// Simple in-memory limiter (best-effort). Not for multi-instance.
export function rateLimit({ windowMs, max }: { windowMs: number; max: number; }) {
  const store = new Map<Key, Counter>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.headers["x-forwarded-for"] || "unknown").toString();
    const key = `${ip}:${req.method}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const cur = store.get(key);
    if (!cur || now > cur.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (cur.count >= max) {
      const retryAfter = Math.ceil((cur.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfter, 1)));
      return res.status(429).json({ error: "RATE_LIMITED" });
    }
    cur.count += 1;
    return next();
  };
}

