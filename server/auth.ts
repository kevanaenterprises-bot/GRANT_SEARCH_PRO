import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ENCRYPT_KEY = process.env.ENCRYPT_KEY || '0'.repeat(32); // 32 bytes for AES-256

export const PLANS = {
  free:     { draftsPerMonth: 0,   searches: 10,  profiles: 1,   scrape: false, label: 'Free' },
  starter:  { draftsPerMonth: 5,   searches: 100, profiles: 2,   scrape: false, label: 'Starter — $29/mo' },
  pro:      { draftsPerMonth: 20,  searches: 500, profiles: 5,   scrape: true,  label: 'Pro — $79/mo' },
  business: { draftsPerMonth: 99,  searches: 999, profiles: 20,  scrape: true,  label: 'Business — $149/mo' },
  agency:   { draftsPerMonth: 999, searches: 999, profiles: 999, scrape: true,  label: 'Agency — $299/mo' },
} as const;

export type Plan = keyof typeof PLANS;

// JWT
export function signToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

// Password
export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function checkPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// AES-256-CBC encryption for SAM API key storage
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = Buffer.from(ENCRYPT_KEY.slice(0, 32).padEnd(32, '0'));
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(data: string): string {
  const [ivHex, encHex] = data.split(':');
  const key = Buffer.from(ENCRYPT_KEY.slice(0, 32).padEnd(32, '0'));
  const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

// Express middleware
export interface AuthRequest extends Request {
  userId?: number;
  userPlan?: Plan;
  userSamKey?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired session' });
  req.userId = payload.userId;
  next();
}

export function requirePlan(...plans: Plan[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userPlan || !plans.includes(req.userPlan)) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        requiredPlans: plans,
        currentPlan: req.userPlan || 'free',
      });
    }
    next();
  };
}
