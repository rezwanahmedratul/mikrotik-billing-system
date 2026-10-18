'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Loader2, Building, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function OnboardingPage() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const res = await fetchApi('/auth/register-tenant', {
      method: 'POST',
      body: JSON.stringify({
        tenantName,
        tenantCode: tenantCode.toUpperCase(),
        adminFullName,
        adminEmail,
        adminPassword,
        contactPhone: contactPhone || undefined,
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
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-neutral-50/50 px-4 py-12 text-neutral-900 selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-100 dark:selection:bg-white dark:selection:text-neutral-950 transition-colors">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 font-mono text-lg font-bold text-white shadow-xs dark:bg-white dark:text-neutral-950">
            MT
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            ISP Organization Onboarding
          </h1>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            Create your isolated multi-tenant workspace to manage MikroTik routers and billing
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="h-12 w-12 text-neutral-900 dark:text-white animate-bounce" />
              <h3 className="mt-4 text-base font-bold text-neutral-900 dark:text-white">
                Organization Created Successfully!
              </h3>
              <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                Setting up your workspace and redirecting to operations console...
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div
                  id="onboarding-error-alert"
                  className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    1. ISP Company Information
                  </h2>
                </div>

                <div>
                  <label htmlFor="tenantName" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Company / Brand Name *
                  </label>
                  <input
                    id="tenantName"
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="e.g. Apex Broadband Ltd"
                    className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:bg-neutral-800 dark:focus:ring-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tenantCode" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Organization Code *
                    </label>
                    <input
                      id="tenantCode"
                      type="text"
                      required
                      value={tenantCode}
                      onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                      placeholder="e.g. APEXNET"
                      className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs font-mono uppercase text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:bg-neutral-800 dark:focus:ring-white transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Support Hotline
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+8801700000000"
                      className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:bg-neutral-800 dark:focus:ring-white transition"
                    />
                  </div>
                </div>

                <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3 pt-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    2. Primary Administrator Account
                  </h2>
                </div>

                <div>
                  <label htmlFor="adminFullName" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Administrator Full Name *
                  </label>
                  <input
                    id="adminFullName"
                    type="text"
                    required
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    placeholder="e.g. Shakil Ahmed"
                    className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:bg-neutral-800 dark:focus:ring-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="adminEmail" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Work Email Address *
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@apexnet.com"
                      className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:bg-neutral-800 dark:focus:ring-white transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="adminPassword" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Master Password *
                    </label>
                    <input
                      id="adminPassword"
                      type="password"
                      required
                      minLength={8}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:bg-neutral-800 dark:focus:ring-white transition"
                    />
                  </div>
                </div>

                <button
                  id="onboarding-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus:ring-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Provisioning Workspace...
                    </>
                  ) : (
                    <>
                      Complete Registration <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Already have an organization?{' '}
          <Link
            href="/login"
            className="font-semibold text-neutral-900 dark:text-white underline underline-offset-4 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Sign in to Console
          </Link>
        </p>
      </div>
    </div>
  );
}
