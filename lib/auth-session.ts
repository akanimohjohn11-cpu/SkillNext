import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  location: string;
}

const COOKIE_NAME = 'skillnest_session';

// Runtime-safe ephemeral fallback when SESSION_SECRET env var is unset
const globalForSecret = globalThis as unknown as { __skillnestSecret?: string };
function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (!globalForSecret.__skillnestSecret) {
    globalForSecret.__skillnestSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForSecret.__skillnestSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSessionToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payload)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser & {
      exp: number;
    };
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return {
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
      role: decoded.role,
      location: decoded.location,
    };
  } catch {
    return null;
  }
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const cookieSession = token ? verifySessionToken(token) : null;

  if (cookieSession?.role === 'admin') {
    return cookieSession;
  }

  if (isSupabaseServerConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const meta = (user.user_metadata ?? {}) as Record<string, string>;
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, location, is_active')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && profile.is_active === false) {
            return null;
          }

          return {
            id: user.id,
            email: user.email ?? '',
            fullName:
              (profile?.full_name as string) ||
              meta.full_name ||
              user.email?.split('@')[0] ||
              'SkillNest Member',
            role: ((profile?.role as UserRole) || (meta.role as UserRole) || 'client'),
            location: (profile?.location as string) || meta.location || 'Lagos',
          };
        }
      }
    } catch {
      // Fall through to signed session cookie check
    }
  }

  return cookieSession;
}

export function getSessionCookieConfig(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getClearSessionCookieConfig() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 0,
  };
}

export function isSameOriginMutation(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const requestedWith = req.headers.get('x-requested-with');
  if (requestedWith === 'SkillNestClient') return true;
  if (!origin || !host) return true;
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host === host;
  } catch {
    return false;
  }
}
