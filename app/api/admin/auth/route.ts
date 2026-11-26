import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCurrentSessionUser,
  getSessionCookieConfig,
  hashPassword,
  isSameOriginMutation,
  SessionUser,
  signSessionToken,
  verifyPassword,
} from '@/lib/auth-session';
import { getStore } from '@/lib/marketplace-store';

function getEnvAdminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET() {
  const store = getStore();
  const session = await getCurrentSessionUser();
  const envConfigured = getEnvAdminPasscode().length > 0;
  const isClaimed = Boolean(store.adminPasscodeHash);

  return NextResponse.json({
    envConfigured,
    isClaimed,
    isAdmin: session?.role === 'admin',
  });
}

const adminAuthSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('claim'),
    passcode: z.string().min(6, 'Admin passcode must be at least 6 characters').max(128),
  }),
  z.object({
    action: z.literal('login'),
    passcode: z.string().min(1, 'Enter your admin passcode').max(128),
  }),
]);

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminAuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid passcode request' },
      { status: 400 }
    );
  }

  const store = getStore();
  const envPasscode = getEnvAdminPasscode();
  const data = parsed.data;

  if (data.action === 'claim') {
    if (envPasscode) {
      return NextResponse.json(
        { error: 'Admin passcode is already configured in environment secrets.' },
        { status: 409 }
      );
    }
    if (store.adminPasscodeHash) {
      return NextResponse.json(
        { error: 'Admin passcode has already been claimed. Please sign in.' },
        { status: 409 }
      );
    }
    store.adminPasscodeHash = hashPassword(data.passcode);
  } else {
    // Login verification: configured env ADMIN_PASSCODE always overrides claimed fallback hash
    let authorized = false;
    if (envPasscode) {
      authorized = timingSafeMatch(data.passcode, envPasscode);
    } else if (store.adminPasscodeHash) {
      authorized = verifyPassword(data.passcode, store.adminPasscodeHash);
    } else {
      return NextResponse.json(
        { error: 'No admin passcode configured yet. Complete first-run setup.' },
        { status: 400 }
      );
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Incorrect admin passcode' }, { status: 401 });
    }
  }

  const adminRecord = store.users.find((u) => u.user.role === 'admin')?.user;
  const adminSession: SessionUser = {
    id: adminRecord?.id || 'user-admin-1',
    email: adminRecord?.email || 'admin@skillnext.ng',
    fullName: adminRecord?.fullName || 'SkillNext Admin',
    role: 'admin',
    location: adminRecord?.location || 'Victoria Island, Lagos',
  };

  const token = signSessionToken(adminSession);
  const res = NextResponse.json({ user: adminSession });
  res.cookies.set(getSessionCookieConfig(token));
  return res;
}
