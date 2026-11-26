import crypto from 'crypto';
import { SEED_CATEGORIES } from '@/lib/constants';
import {
  SEED_INQUIRIES,
  SEED_PROVIDERS,
  SEED_REQUESTS,
  SEED_USERS,
  SEED_VERIFICATIONS,
} from '@/lib/seed-data';
import { hashPassword } from '@/lib/auth-session';
import {
  Category,
  ContactSubmission,
  Inquiry,
  ProviderProfile,
  ServiceRequest,
  UserProfile,
  VerificationSubmission,
} from '@/types';

interface StoredAuthRecord {
  user: UserProfile;
  passwordHash: string;
}

export interface MarketplaceStoreState {
  categories: Category[];
  users: StoredAuthRecord[];
  providers: ProviderProfile[];
  requests: ServiceRequest[];
  inquiries: Inquiry[];
  verifications: VerificationSubmission[];
  savedProviders: Record<string, string[]>;
  contacts: ContactSubmission[];
  adminPasscodeHash?: string;
}

const globalStore = globalThis as unknown as {
  __skillnestStore?: MarketplaceStoreState;
};

function createInitialStore(): MarketplaceStoreState {
  // Default preview credentials use a single consistent password hash generated at runtime only for demo sign-in buttons
  const defaultPreviewHash = hashPassword('SkillNest2026!');

  return {
    categories: structuredClone(SEED_CATEGORIES),
    users: SEED_USERS.map((user) => ({
      user: structuredClone(user),
      passwordHash: defaultPreviewHash,
    })),
    providers: structuredClone(SEED_PROVIDERS),
    requests: structuredClone(SEED_REQUESTS),
    inquiries: structuredClone(SEED_INQUIRIES),
    verifications: structuredClone(SEED_VERIFICATIONS),
    savedProviders: {
      'user-client-1': ['prov-amara-atelier', 'prov-kemi-legal'],
    },
    contacts: [],
  };
}

export function getStore(): MarketplaceStoreState {
  if (!globalStore.__skillnestStore) {
    globalStore.__skillnestStore = createInitialStore();
  }
  return globalStore.__skillnestStore;
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function calculateProfileCompleteness(provider: ProviderProfile): {
  score: number;
  checks: { label: string; completed: boolean }[];
} {
  const checks = [
    { label: 'Profile portrait uploaded', completed: Boolean(provider.avatarUrl) },
    { label: 'Professional headline & bio (50+ chars)', completed: provider.bio.trim().length >= 50 },
    { label: 'At least 3 specialized skills listed', completed: provider.skills.length >= 3 },
    { label: 'Service rate card published', completed: provider.services.length >= 1 },
    { label: 'Portfolio work showcased', completed: provider.portfolio.length >= 1 },
    {
      label: 'Identity / NIN verification approved',
      completed: provider.verificationStatus === 'verified',
    },
  ];
  const completedCount = checks.filter((c) => c.completed).length;
  return {
    score: Math.round((completedCount / checks.length) * 100),
    checks,
  };
}
