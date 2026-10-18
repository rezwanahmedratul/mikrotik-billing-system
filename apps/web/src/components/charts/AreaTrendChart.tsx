'use client';

import React, { useState, useId } from 'react';
import { ChartDataPoint } from './charts.types';

interface AreaTrendChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  valueFormatter?: (val: number) => string;
  height?: number;
  className?: string;
}

export function AreaTrendChart({
  data,
  title,
  description,
  primaryLabel = 'Primary',
  secondaryLabel,
  valueFormatter = (val: number) => val.toLocaleString(),
  height = 220,
  className = '',
}: AreaTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartId = useId().replace(/:/g, '');

  if (!data || data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-neutral-400">
        Insufficient telemetry data to plot chart.
      </div>
    );
  }

  const values1 = data.map((d) => d.value);
  const values2 = secondaryLabel ? data.map((d) => d.secondaryValue ?? 0) : [];
  const allValues = [...values1, ...values2];

  const max = Math.max(...allValues) * 1.15 || 10;
  const min = 0;
  const range = max - min;

  const width = 600;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const getCoordinates = (values: number[]) => {
    return values.map((val, idx) => {
      const x = padLeft + (idx / (values.length - 1)) * plotWidth;
      const y = padTop + plotHeight - ((val - min) / range) * plotHeight;
      return { x, y, val };
    });
  };

  const points1 = getCoordinates(values1);
  const points2 = values2.length > 0 ? getCoordinates(values2) : [];

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    return pts.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cpX = (prev.x + point.x) / 2;
      return `${acc} C ${cpX},${prev.y} ${cpX},${point.y} ${point.x},${point.y}`;
    }, '');
  };

  const path1 = createSmoothPath(points1);
  const area1 = `${path1} L ${padLeft + plotWidth},${padTop + plotHeight} L ${padLeft},${
    padTop + plotHeight
  } Z`;

  const path2 = points2.length > 0 ? createSmoothPath(points2) : '';
  const area2 =
    points2.length > 0
      ? `${path2} L ${padLeft + plotWidth},${padTop + plotHeight} L ${padLeft},${
          padTop + plotHeight
        } Z`
      : '';

  // Grid levels (4 lines)
  const gridTicks = [0, 0.33, 0.66, 1].map((pct) => ({
    y: padTop + plotHeight - pct * plotHeight,
    val: valueFormatter(Math.round(min + pct * range)),
  }));

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div
      className={`rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition-colors ${className}`}
    >
      {(title || description) && (
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
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

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-900 dark:bg-white" />
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                {primaryLabel}
              </span>
            </div>
            {secondaryLabel && (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  {secondaryLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`${chartId}-grad1`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={`${chartId}-grad2`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#71717a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#71717a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

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
                className="fill-neutral-400 font-mono text-[9px] dark:fill-neutral-500"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Series 2 Area & Path */}
          {points2.length > 0 && (
            <>
              <path d={area2} fill={`url(#${chartId}-grad2)`} />
              <path
                d={path2}
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Series 1 Area & Path */}
          <path d={area1} fill={`url(#${chartId}-grad1)`} />
          <path
            d={path1}
            fill="none"
            className="stroke-neutral-900 dark:stroke-white"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* X-Axis Labels */}
          {data.map((d, i) => {
            // Render label every N points to avoid overlap
            const step = Math.ceil(data.length / 6);
            if (i % step !== 0 && i !== data.length - 1) return null;
            const x = padLeft + (i / (data.length - 1)) * plotWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="fill-neutral-400 font-mono text-[9px] dark:fill-neutral-500"
              >
                {d.label}
              </text>
            );
          })}

          {/* Hover Crosshair and Trigger Areas */}
          {data.map((_, i) => {
            const x = padLeft + (i / (data.length - 1)) * plotWidth;
            const stepWidth = plotWidth / (data.length - 1);
            return (
              <rect
                key={i}
                x={x - stepWidth / 2}
                y={padTop}
                width={stepWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Active Hover Indicators */}
          {hoverIndex !== null && points1[hoverIndex] && (
            <g>
              <line
                x1={points1[hoverIndex].x}
                y1={padTop}
                x2={points1[hoverIndex].x}
                y2={padTop + plotHeight}
                stroke="currentColor"
                className="text-neutral-400 dark:text-neutral-600"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={points1[hoverIndex].x}
                cy={points1[hoverIndex].y}
                r="4.5"
                className="fill-neutral-900 stroke-white stroke-2 dark:fill-white dark:stroke-neutral-900"
              />
              {points2[hoverIndex] && (
                <circle
                  cx={points2[hoverIndex].x}
                  cy={points2[hoverIndex].y}
                  r="3.5"
                  className="fill-neutral-500 stroke-white stroke-2 dark:fill-neutral-400 dark:stroke-neutral-900"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Popup */}
        {activePoint && hoverIndex !== null && points1[hoverIndex] && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-neutral-200/90 bg-neutral-900/95 p-2 text-white shadow-xl backdrop-blur-xs dark:border-neutral-700 dark:bg-white/95 dark:text-neutral-900 transition-all duration-75"
            style={{
              left: `${(points1[hoverIndex].x / width) * 100}%`,
              top: `${Math.max(10, (points1[hoverIndex].y / height) * 100 - 45)}%`,
            }}
          >
            <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
              {activePoint.label}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-xs font-bold">
                {primaryLabel}: {valueFormatter(activePoint.value)}
              </span>
            </div>
            {secondaryLabel && activePoint.secondaryValue !== undefined && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-300 dark:text-neutral-700">
                <span>
                  {secondaryLabel}: {valueFormatter(activePoint.secondaryValue)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
