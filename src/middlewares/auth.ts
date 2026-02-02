import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });

    const secret = process.env.JWT_ACCESS_SECRET || "dev_access";
    const payload = jwt.verify(token, secret) as any;
    const userId = payload.id || payload._id || payload.userId;
    (req as any).user = { id: userId, _id: userId };
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
