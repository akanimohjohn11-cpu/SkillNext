const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Normalizes a Supabase URL so both project URLs
 * (`https://xyz.supabase.co`) and REST URLs (`https://xyz.supabase.co/rest/v1/`)
 * resolve cleanly to the base project origin required by `@supabase/ssr`.
 */
export function normalizeSupabaseUrl(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}
