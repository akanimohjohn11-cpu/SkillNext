import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionUser, isSameOriginMutation } from '@/lib/auth-session';
import { createServerSupabaseClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hasValidMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === 'image/jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === 'image/png') {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    );
  }
  if (mime === 'image/webp') {
    return (
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const session = await getCurrentSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required for uploads' }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const bucketRaw = formData.get('bucket');
  const bucket = bucketRaw === 'avatars' ? 'avatars' : 'portfolios';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, and WebP images are permitted' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image size must be 5MB or smaller' },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!hasValidMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: 'File contents do not match declared image format' },
      { status: 400 }
    );
  }

  const filename = `${crypto.randomUUID()}.${ext}`;

  // Upload to Supabase Storage when configured
  if (isSupabaseServerConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const storagePath = `${session.id}/${filename}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        return NextResponse.json({ url: data.publicUrl, storage: 'supabase' });
      }
    }
  }

  // Confined local upload fallback for preview mode
  const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const safePath = path.resolve(uploadDir, filename);

  if (!safePath.startsWith(uploadDir + path.sep)) {
    return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 });
  }

  await fs.writeFile(safePath, buffer);
  return NextResponse.json({
    url: `/uploads/${filename}`,
    storage: 'local',
  });
}
