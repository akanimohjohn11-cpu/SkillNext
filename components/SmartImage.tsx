'use client';

import Image from 'next/image';
import { Briefcase } from 'lucide-react';
import { useState } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

const SHIMMER_BLUR_DATA_URL =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='30'%3E%3Crect width='40' height='30' fill='%23e2e8f0'/%3E%3C/svg%3E";

export function SmartImage({
  src,
  alt,
  className = 'object-cover',
  fill = false,
  width = 800,
  height = 600,
  priority = false,
  sizes,
  quality = 90,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/60 text-slate-500 ${
          fill ? 'absolute inset-0' : 'w-full h-full min-h-[160px]'
        }`}
        role="img"
        aria-label={alt}
      >
        <Briefcase className="w-7 h-7 text-[#0F766E]/60 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-600 px-4 text-center line-clamp-2">
          {alt}
        </span>
      </div>
    );
  }

  const bypassOptimizer = src.startsWith('/uploads/') || src.startsWith('data:');

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        quality={quality}
        sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        placeholder="blur"
        blurDataURL={SHIMMER_BLUR_DATA_URL}
        referrerPolicy="no-referrer"
        unoptimized={bypassOptimizer}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={quality}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      referrerPolicy="no-referrer"
      unoptimized={bypassOptimizer}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
