import jwt, { SignOptions, Secret } from "jsonwebtoken";

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || "dev_access";
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || "dev_refresh";

export function signAccess(payload: object, expiresIn = "1d") {
  return jwt.sign(payload as any, ACCESS_SECRET, { expiresIn } as SignOptions);
}
export function signRefresh(payload: object, expiresIn = "7d") {
  return jwt.sign(payload as any, REFRESH_SECRET, { expiresIn } as SignOptions);
}
export function verifyAccess(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}
export function verifyRefresh(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
