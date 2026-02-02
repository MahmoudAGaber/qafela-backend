// Infrastructure - JWT utilities
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const ACCESS_SECRET: Secret = process.env.JWT_ACCESS_SECRET || 'dev_access';
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'dev_refresh';

export function signAccess(payload: { id: string; username: string }, expiresIn = '1d'): string {
  return jwt.sign(payload as any, ACCESS_SECRET, { expiresIn } as SignOptions);
}

export function signRefresh(payload: { id: string }, expiresIn = '7d'): string {
  return jwt.sign(payload as any, REFRESH_SECRET, { expiresIn } as SignOptions);
}

export function verifyAccess(token: string): { id: string; username: string } {
  return jwt.verify(token, ACCESS_SECRET) as { id: string; username: string };
}

export function verifyRefresh(token: string): { id: string } {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
}

