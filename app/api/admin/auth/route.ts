import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  hashPassword,
  isSameOriginMutation,
  signAdminConsoleToken,
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
  const envConfigured = getEnvAdminPasscode().length > 0;
  const isClaimed = Boolean(store.adminPasscodeHash);

  return NextResponse.json({
    envConfigured,
    isClaimed,
  });
}

const adminAuthSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('claim'),
    passcode: z.string().min(6, 'Admin password must be at least 6 characters').max(128),
  }),
  z.object({
    action: z.literal('login'),
    passcode: z.string().min(1, 'Enter your admin password').max(128),
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
      { error: parsed.error.issues[0]?.message || 'Invalid password request' },
      { status: 400 }
    );
  }

  const store = getStore();
  const envPasscode = getEnvAdminPasscode();
  const data = parsed.data;

  if (data.action === 'claim') {
    if (envPasscode) {
      return NextResponse.json(
        { error: 'Admin password is already configured in environment secrets.' },
        { status: 409 }
      );
    }
    if (store.adminPasscodeHash) {
      return NextResponse.json(
        { error: 'Admin password has already been set. Please enter it to unlock.' },
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
        { error: 'No admin password configured yet. Complete first-run setup.' },
        { status: 400 }
      );
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Incorrect admin password' }, { status: 401 });
    }
  }

  // Issue a memory-only Bearer token (no persistent cookie) so every access requires password entry
  const adminToken = signAdminConsoleToken();
  return NextResponse.json({ adminToken });
}
