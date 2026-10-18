'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-neutral-50/50 px-4 py-12 text-neutral-900 selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-100 dark:selection:bg-white dark:selection:text-neutral-950 transition-colors">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 font-mono text-lg font-bold text-white shadow-xs dark:bg-white dark:text-neutral-950">
            MT
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Sign In to Console
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            Enter your credentials to access your isolated ISP operations dashboard
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-7 shadow-xs dark:border-neutral-800 dark:bg-black">
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-neutral-300 bg-neutral-100 p-3.5 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-neutral-900 dark:text-neutral-100" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@fastnet.com"
                className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white transition"
              />
            </div>

            <div>
              <label htmlFor="tenantCode" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Organization Code <span className="text-neutral-400 font-normal dark:text-neutral-500">(Optional for direct logins)</span>
              </label>
              <input
                id="tenantCode"
                type="text"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                placeholder="e.g. FASTNET"
                className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white transition"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:focus:ring-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Switcher for Development / Demo */}
          <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-neutral-800">
            <span className="block text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Quick Fill Demo Accounts:
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset('admin@fastnet.com', 'FASTNET')}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 text-left text-[11px] text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 transition"
              >
                <span className="font-semibold block text-neutral-900 dark:text-white">FastNet Admin</span>
                Owner (Full Access)
              </button>
              <button
                type="button"
                onClick={() => setPreset('cashier@fastnet.com', 'FASTNET')}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 text-left text-[11px] text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 transition"
              >
                <span className="font-semibold block text-neutral-900 dark:text-white">FastNet Cashier</span>
                Billing Only
              </button>
              <button
                type="button"
                onClick={() => setPreset('operator@fastnet.com', 'FASTNET')}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 text-left text-[11px] text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 transition"
              >
                <span className="font-semibold block text-neutral-900 dark:text-white">FastNet NOC</span>
                Router Operator
              </button>
              <button
                type="button"
                onClick={() => setPreset('admin@skylink.com', 'SKYLINK')}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 text-left text-[11px] text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-900 transition"
              >
                <span className="font-semibold block text-neutral-900 dark:text-white">SkyLink Admin</span>
                Tenant B Isolation
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Need to register a new ISP company?{' '}
          <Link
            href="/onboarding"
            className="font-semibold text-neutral-900 dark:text-white underline underline-offset-4 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Create Organization
          </Link>
        </p>
      </div>
    </div>
  );
}
