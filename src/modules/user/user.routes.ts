import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { rateLimit } from "../../middlewares/rateLimit";
import { register, login, me } from "./user.controller";

const router = Router();

const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", auth, me);

export default router;
