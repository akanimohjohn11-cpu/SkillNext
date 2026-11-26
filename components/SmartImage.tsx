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
}

export function SmartImage({
  src,
  alt,
  className = 'object-cover',
  fill = false,
  width = 800,
  height = 600,
  priority = false,
  sizes,
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

  const isLocalUpload = src.startsWith('/uploads/');

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
        priority={priority}
        referrerPolicy="no-referrer"
        unoptimized={isLocalUpload}
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
      sizes={sizes}
      priority={priority}
      referrerPolicy="no-referrer"
      unoptimized={isLocalUpload}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
