'use client';

import React, { useState } from 'react';
import { ChartDataPoint } from './charts.types';

interface MultiBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  valueFormatter?: (val: number) => string;
  height?: number;
  className?: string;
}

export function MultiBarChart({
  data,
  title,
  description,
  primaryLabel = 'Primary',
  secondaryLabel,
  valueFormatter = (val: number) => val.toLocaleString(),
  height = 220,
  className = '',
}: MultiBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-neutral-400">
        No bar chart records available.
      </div>
    );
  }

  const values1 = data.map((d) => d.value);
  const values2 = secondaryLabel ? data.map((d) => d.secondaryValue ?? 0) : [];
  const max = Math.max(...values1, ...(values2.length ? values2 : [0])) * 1.15 || 10;

  const width = 600;
  const padLeft = 52;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const groupWidth = plotWidth / data.length;
  const isDual = !!secondaryLabel;
  const barWidth = isDual ? Math.min(18, groupWidth * 0.35) : Math.min(28, groupWidth * 0.55);
  const barGap = 4;

  const gridTicks = [0, 0.33, 0.66, 1].map((pct) => ({
    y: padTop + plotHeight - pct * plotHeight,
    val: valueFormatter(Math.round(pct * max)),
  }));

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition-colors ${className}`}
    >
      {(title || description) && (
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-neutral-900 dark:bg-white" />
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                {primaryLabel}
              </span>
            </div>
            {secondaryLabel && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-neutral-400 dark:bg-neutral-600" />
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  {secondaryLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG Container */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Gridlines */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={padLeft + plotWidth}
                y2={tick.y}
                stroke="currentColor"
                className="text-neutral-100 dark:text-neutral-800"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 3}
                textAnchor="end"
                fontSize="8"
                style={{ fontSize: '8px' }}
                className="fill-neutral-400 font-mono dark:fill-neutral-500"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, i) => {
            const groupCenterX = padLeft + (i + 0.5) * groupWidth;
            const h1 = (item.value / max) * plotHeight;
            const y1 = padTop + plotHeight - h1;

            const isHovered = hoverIndex === i;

            if (isDual) {
              const h2 = ((item.secondaryValue ?? 0) / max) * plotHeight;
              const y2 = padTop + plotHeight - h2;
              const x1 = groupCenterX - barWidth - barGap / 2;
              const x2 = groupCenterX + barGap / 2;

              return (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)}>
                  {/* Hover Column Highlight */}
                  {isHovered && (
                    <rect
                      x={groupCenterX - groupWidth / 2}
                      y={padTop}
                      width={groupWidth}
                      height={plotHeight}
                      className="fill-neutral-100/60 dark:fill-neutral-800/40"
                      rx="4"
                    />
                  )}
                  {/* Bar 1 */}
                  <rect
                    x={x1}
                    y={y1}
                    width={barWidth}
                    height={Math.max(2, h1)}
                    rx="3"
                    className="fill-neutral-900 transition-opacity dark:fill-white"
                    opacity={isHovered ? 1 : 0.9}
                  />
                  {/* Bar 2 */}
                  <rect
                    x={x2}
                    y={y2}
                    width={barWidth}
                    height={Math.max(2, h2)}
                    rx="3"
                    className="fill-neutral-400 transition-opacity dark:fill-neutral-600"
                    opacity={isHovered ? 1 : 0.85}
                  />
                  {/* X Axis Label */}
                  <text
                    x={groupCenterX}
                    y={height - 6}
                    textAnchor="middle"
                    fontSize="8"
                    style={{ fontSize: '8px' }}
                    className="fill-neutral-400 font-mono dark:fill-neutral-500"
                  >
                    {item.label}
                  </text>
                </g>
              );
            }

            // Single Bar
            const x = groupCenterX - barWidth / 2;
            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoverIndex(i)}>
                {isHovered && (
                  <rect
                    x={groupCenterX - groupWidth / 2}
                    y={padTop}
                    width={groupWidth}
                    height={plotHeight}
                    className="fill-neutral-100/60 dark:fill-neutral-800/40"
                    rx="4"
                  />
                )}
                <rect
                  x={x}
                  y={y1}
                  width={barWidth}
                  height={Math.max(2, h1)}
                  rx="3"
                  className="fill-neutral-900 transition-opacity dark:fill-white"
                  opacity={isHovered ? 1 : 0.88}
                />
                <text
                  x={groupCenterX}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="8"
                  style={{ fontSize: '8px' }}
                  className="fill-neutral-400 font-mono dark:fill-neutral-500"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-neutral-200/90 bg-neutral-900/95 p-2 text-white shadow-xl backdrop-blur-xs dark:border-neutral-700 dark:bg-white/95 dark:text-neutral-900 transition-all duration-75"
            style={{
              left: `${((padLeft + (hoverIndex + 0.5) * groupWidth) / width) * 100}%`,
              top: '10%',
            }}
          >
            <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
              {activePoint.label}
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold">
              {primaryLabel}: {valueFormatter(activePoint.value)}
            </div>
            {secondaryLabel && activePoint.secondaryValue !== undefined && (
              <div className="font-mono text-[11px] text-neutral-300 dark:text-neutral-700">
                {secondaryLabel}: {valueFormatter(activePoint.secondaryValue)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
