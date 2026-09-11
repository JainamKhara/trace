'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProductLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'horizontal' | 'stacked' | 'icon-only';
  showSubtitle?: boolean;
  className?: string;
}

export function ProductLogo({
  size = 'md',
  variant = 'horizontal',
  showSubtitle = true,
  className
}: ProductLogoProps) {
  // Dimensions for container and typography
  const dimensions = {
    sm: {
      box: 'size-9 rounded-lg p-1',
      title: 'text-sm font-bold tracking-tight text-slate-900',
      subtitle: 'text-[10px] text-blue-600 font-medium tracking-wide'
    },
    md: {
      box: 'size-12 rounded-xl p-1.5',
      title: 'text-base font-bold tracking-tight text-slate-900',
      subtitle: 'text-xs text-blue-600 font-medium tracking-wide'
    },
    lg: {
      box: 'size-16 rounded-2xl p-2',
      title: 'text-xl font-bold tracking-tight text-slate-900',
      subtitle: 'text-xs text-blue-600 font-medium tracking-wider uppercase'
    }
  };

  // High-visibility, unique TRACE Intelligence Triquetra Nexus Emblem
  const LogoEmblem = (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 bg-blue-50/90 border border-blue-200/80 shadow-xs transition-transform duration-200 group-hover:scale-105',
        dimensions[size].box
      )}
      title="TRACE Network Intelligence"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <linearGradient id="traceGradA" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="traceGradB" x1="38" y1="36" x2="10" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="traceGradC" x1="24" y1="42" x2="24" y2="6" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1d4ed8" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>

        {/* 3-Fold Interconnected Intelligence Nexus Orbital Arcs */}
        {/* Loop 1: Top to Bottom-Right */}
        <path
          d="M24 7 C33 15, 41 25, 38 34 C35 41, 23 37, 18 29 C14 23, 18 12, 24 7Z"
          stroke="url(#traceGradA)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-95"
        />

        {/* Loop 2: Bottom-Right to Bottom-Left */}
        <path
          d="M38 34 C31 39, 17 41, 10 34 C4 27, 12 17, 21 16 C27 15, 34 25, 38 34Z"
          stroke="url(#traceGradB)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-95"
        />

        {/* Loop 3: Bottom-Left to Top */}
        <path
          d="M10 34 C12 23, 18 11, 24 7 C31 4, 34 16, 30 23 C26 29, 16 31, 10 34Z"
          stroke="url(#traceGradC)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-95"
        />

        {/* Inner Central Linkage Hub */}
        <circle cx="24" cy="24" r="5" stroke="#0284c7" strokeWidth="1.75" strokeDasharray="2.5 1.5" />
        <circle cx="24" cy="24" r="2.2" fill="#2563eb" />

        {/* Vertex Evidence / Entity Nodes */}
        <circle cx="24" cy="7" r="3.2" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        <circle cx="24" cy="7" r="1.4" fill="#0284c7" />

        <circle cx="38" cy="34" r="3.2" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        <circle cx="38" cy="34" r="1.4" fill="#0284c7" />

        <circle cx="10" cy="34" r="3.2" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        <circle cx="10" cy="34" r="1.4" fill="#0284c7" />
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return (
      <div className={cn('inline-flex items-center', className)}>
        {LogoEmblem}
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center text-center gap-3', className)}>
        {LogoEmblem}
        <div className="flex flex-col items-center">
          <span className={dimensions[size].title}>
            TRACE
          </span>
          {showSubtitle && (
            <span className={cn('mt-0.5', dimensions[size].subtitle)}>
              Network Intelligence
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant (default for Sidebar & Navbars)
  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {LogoEmblem}
      <div className="flex flex-col min-w-0 text-left">
        <span className={cn('leading-none', dimensions[size].title)}>
          TRACE
        </span>
        {showSubtitle && (
          <span className={cn('leading-tight mt-1 truncate', dimensions[size].subtitle)}>
            Network Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
