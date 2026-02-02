import { Request, Response } from "express";
import { registerSchema, loginSchema } from "./user.schema";
import { registerUser, authenticateUser, getUserById } from "./user.service";

interface AuthenticatedRequest extends Request {
  user?: { _id: any };
}

function ok<T>(res: Response, data: T, code = 200, message = 'success') {
  return res.status(code).json({ status: 'success', code, message, data });
}

function fail(res: Response, code: number, message: string) {
  return res.status(code).json({ status: 'error', code, message });
}

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "INVALID_DATA");
    try {
      const { user, tokens } = await registerUser(parsed.data);
      return ok(res, { user, tokens }, 201);
    } catch (e: any) {
      if (e?.message === "USERNAME_TAKEN") return fail(res, 400, "USERNAME_TAKEN");
      if (e?.message === "EMAIL_TAKEN") return fail(res, 400, "EMAIL_TAKEN");
      return fail(res, 500, "REGISTER_FAILED");
    }
  } catch {
    return fail(res, 500, "REGISTER_FAILED");
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "INVALID_DATA");
    try {
      const { user, tokens } = await authenticateUser(parsed.data);
      return ok(res, { user, tokens }, 200);
    } catch (e: any) {
      if (e?.message === "INVALID_CREDENTIALS") return fail(res, 400, "INVALID_CREDENTIALS");
      if (e?.message === "INVALID_DATA") return fail(res, 400, "INVALID_DATA");
      return fail(res, 500, "LOGIN_FAILED");
    }
  } catch {
    return fail(res, 500, "LOGIN_FAILED");
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const uid = req.user?._id;
  if (!uid) return fail(res, 401, "UNAUTHORIZED");
  const user = await getUserById(uid);
  if (!user) return fail(res, 404, "NOT_FOUND");
  return ok(res, user, 200);
}
