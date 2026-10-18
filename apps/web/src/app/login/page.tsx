'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fastnet.com');
  const [password, setPassword] = useState('Password123!');
  const [tenantCode, setTenantCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        tenantId: tenantCode ? tenantCode : undefined,
      }),
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
      return;
    }

    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('tenant', JSON.stringify(res.data.tenant));
      router.push('/dashboard');
    }
  };

  const setPreset = (presetEmail: string, presetCode = '') => {
    setEmail(presetEmail);
    setPassword('Password123!');
    setTenantCode(presetCode);
    setErrorMessage('');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded border border-neutral-900 bg-neutral-900 font-mono text-base font-bold text-white shadow-sm">
            MT
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
            Sign In to Console
          </h1>
          <p className="mt-1.5 text-xs text-neutral-600">
            Enter your credentials to access your ISP operations dashboard
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded border border-border bg-surface p-6 shadow-sm">
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-4 flex items-center gap-2 rounded border border-status-error-border bg-status-error-bg p-3 text-xs text-status-error"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-800">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@fastnet.com"
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-800">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label htmlFor="tenantCode" className="block text-xs font-medium text-neutral-800">
                Organization Code <span className="text-neutral-400 font-normal">(Optional)</span>
              </label>
              <input
                id="tenantCode"
                type="text"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                placeholder="e.g. FASTNET"
                className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-neutral-900 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Switcher for Development / Demo */}
          <div className="mt-6 border-t border-border pt-4">
            <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Quick Fill Demo Accounts:
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset('admin@fastnet.com', 'FASTNET')}
                className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left text-[11px] text-neutral-700 hover:bg-neutral-100"
              >
                <span className="font-semibold block">FastNet Admin</span>
                Owner (Full Access)
              </button>
              <button
                type="button"
                onClick={() => setPreset('cashier@fastnet.com', 'FASTNET')}
                className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left text-[11px] text-neutral-700 hover:bg-neutral-100"
              >
                <span className="font-semibold block">FastNet Cashier</span>
                Billing Only
              </button>
              <button
                type="button"
                onClick={() => setPreset('operator@fastnet.com', 'FASTNET')}
                className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left text-[11px] text-neutral-700 hover:bg-neutral-100"
              >
                <span className="font-semibold block">FastNet NOC</span>
                Router Operator
              </button>
              <button
                type="button"
                onClick={() => setPreset('admin@skylink.com', 'SKYLINK')}
                className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left text-[11px] text-neutral-700 hover:bg-neutral-100"
              >
                <span className="font-semibold block">SkyLink Admin</span>
                Tenant B Isolation
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-neutral-600">
          Need to register a new ISP company?{' '}
          <Link
            href="/onboarding"
            className="font-semibold text-neutral-900 underline underline-offset-2"
          >
            Create Organization
          </Link>
        </p>
      </div>
    </div>
  );
}
