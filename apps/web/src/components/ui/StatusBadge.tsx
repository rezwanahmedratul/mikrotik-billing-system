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
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    outline: 'bg-transparent text-neutral-700 border-neutral-300',
  };

  const dotStyles: Record<StatusVariant, string> = {
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    error: 'bg-rose-600',
    info: 'bg-sky-600',
    neutral: 'bg-neutral-500',
    outline: 'bg-neutral-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium tracking-tight ${variantStyles[resolvedVariant]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[resolvedVariant]}`} />
      <span className="capitalize">{displayLabel.toLowerCase()}</span>
    </span>
  );
}
