'use client';

import React, { useState } from 'react';
import { DonutSegment } from './charts.types';

interface DonutPieChartProps {
  data: DonutSegment[];
  title?: string;
  description?: string;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  className?: string;
}

const MONOCHROME_PALETTE = [
  '#d4d4d8',
  '#71717a',
  '#a1a1aa',
  '#52525b',
  '#3f3f46',
  '#e4e4e7',
];

export function DonutPieChart({
  data,
  title,
  description,
  centerLabel = 'Total',
  centerValue,
  size = 180,
  className = '',
}: DonutPieChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const segments = data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percentage;

    return {
      ...item,
      percentage: Math.round(percentage),
      strokeDasharray,
      strokeDashoffset,
      color: item.color || MONOCHROME_PALETTE[index % MONOCHROME_PALETTE.length],
    };
  });

  const displayCenterValue = centerValue || total.toLocaleString();

  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition-colors ${className}`}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
        {/* SVG Donut Circle */}
        <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90 transform overflow-visible">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="fill-none stroke-neutral-100 dark:stroke-neutral-800"
              strokeWidth={strokeWidth}
            />

            {/* Data Segments */}
            {segments.map((seg, idx) => {
              const isHovered = hoverIndex === idx;
              return (
                <circle
                  key={seg.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Content */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
              {hoverIndex !== null ? segments[hoverIndex].value.toLocaleString() : displayCenterValue}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {hoverIndex !== null ? segments[hoverIndex].label : centerLabel}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full flex-1 space-y-2">
          {segments.map((seg, idx) => {
            const isHovered = hoverIndex === idx;
            return (
              <div
                key={seg.label}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition cursor-pointer ${
                  isHovered
                    ? 'bg-neutral-100 dark:bg-neutral-800'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {seg.value.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    ({seg.percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
