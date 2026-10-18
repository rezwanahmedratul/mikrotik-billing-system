import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-900">
        <ShieldAlert className="h-6 w-6" />
      </div>

      <h1 className="mt-4 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
        403 — Access Denied
      </h1>

      <p className="mt-2 max-w-md text-xs text-neutral-600 leading-relaxed">
        Your current role does not have permission to access this resource or execute this
        operation. Privileged operations require Administrator privileges.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          Switch Account
        </Link>
      </div>
    </div>
  );
}
