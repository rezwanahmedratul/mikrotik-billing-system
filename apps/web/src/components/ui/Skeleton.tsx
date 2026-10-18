import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded bg-neutral-200/70 dark:bg-neutral-800 ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export function TableSkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-neutral-100 dark:border-neutral-800">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3">
              <Skeleton className="h-3.5 w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
