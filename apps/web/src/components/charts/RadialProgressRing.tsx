'use client';

import React from 'react';

interface RadialProgressRingProps {
  percentage: number;
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function RadialProgressRing({
  percentage,
  label,
  sublabel,
  size = 64,
  strokeWidth = 6,
  color = 'currentColor',
  className = 'text-neutral-900 dark:text-white',
}: RadialProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="fill-none stroke-neutral-100 dark:stroke-neutral-800"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
          {label || `${Math.round(clamped)}%`}
        </span>
        {sublabel && (
          <span className="text-[9px] text-neutral-400 dark:text-neutral-500">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
