import React from 'react';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'info'
  | 'outline';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, variant, label, className = '' }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const displayLabel = label || status.replace(/_/g, ' ');

  let resolvedVariant: StatusVariant = variant || 'neutral';

  if (!variant) {
    if (['ONLINE', 'ACTIVE', 'PAID', 'DELIVERED', 'SUCCEEDED', 'CONFIRMED'].includes(normalized)) {
      resolvedVariant = 'success';
    } else if (['GRACE_PERIOD', 'PARTIALLY_PAID', 'PENDING', 'PROCESSING', 'DEGRADED', 'WARNING'].includes(normalized)) {
      resolvedVariant = 'warning';
    } else if (['OFFLINE', 'UNREACHABLE', 'AUTH_FAILED', 'SUSPENDED', 'FAILED', 'OVERDUE', 'CANCELLED', 'VOID'].includes(normalized)) {
      resolvedVariant = 'error';
    } else if (['INFO', 'REST_HTTPS', 'API_SSL'].includes(normalized)) {
      resolvedVariant = 'info';
    }
  }

  const variantStyles: Record<StatusVariant, string> = {
    success: 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white font-semibold shadow-2xs',
    warning: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700 font-medium',
    error: 'bg-neutral-200 text-neutral-900 border-neutral-400 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-600 font-medium',
    info: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-800 font-medium',
    neutral: 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-950 dark:text-neutral-400 dark:border-neutral-800 font-medium',
    outline: 'bg-transparent text-neutral-800 border-neutral-300 dark:text-neutral-200 dark:border-neutral-700 font-medium',
  };

  const dotStyles: Record<StatusVariant, string> = {
    success: 'bg-white dark:bg-black',
    warning: 'bg-neutral-500 dark:bg-neutral-400',
    error: 'bg-neutral-800 dark:bg-neutral-200',
    info: 'bg-neutral-600 dark:bg-neutral-400',
    neutral: 'bg-neutral-400 dark:bg-neutral-600',
    outline: 'bg-neutral-500 dark:bg-neutral-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] tracking-tight ${variantStyles[resolvedVariant]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[resolvedVariant]}`} />
      <span className="capitalize">{displayLabel.toLowerCase()}</span>
    </span>
  );
}
