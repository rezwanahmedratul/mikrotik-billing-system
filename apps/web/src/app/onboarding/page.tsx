'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Loader2, Building, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded border border-neutral-900 bg-neutral-900 font-mono text-base font-bold text-white shadow-sm">
            MT
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
            ISP Organization Onboarding
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            Create your isolated multi-tenant organization to manage MikroTik routers and billing
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded border border-border bg-surface p-6 shadow-sm">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 animate-bounce" />
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">
                Organization Created Successfully!
              </h3>
              <p className="mt-1 text-xs text-neutral-600">
                Setting up your workspace and redirecting to operations console...
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div
                  id="onboarding-error-alert"
                  className="mb-4 flex items-center gap-2 rounded border border-status-error-border bg-status-error-bg p-3 text-xs text-status-error"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-border pb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    1. ISP Company Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="tenantName"
                      className="block text-xs font-medium text-neutral-800"
                    >
                      Company Name *
                    </label>
                    <input
                      id="tenantName"
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="e.g. MetroNet Fiber"
                      className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tenantCode"
                      className="block text-xs font-medium text-neutral-800"
                    >
                      Unique Organization Code *
                    </label>
                    <input
                      id="tenantCode"
                      type="text"
                      required
                      value={tenantCode}
                      onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                      placeholder="e.g. METRONET"
                      className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="border-b border-border pb-3 pt-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    2. Primary Administrator Account
                  </h2>
                </div>

                <div>
                  <label
                    htmlFor="adminFullName"
                    className="block text-xs font-medium text-neutral-800"
                  >
                    Admin Full Name *
                  </label>
                  <input
                    id="adminFullName"
                    type="text"
                    required
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    placeholder="e.g. Tariq Ahmed"
                    className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="adminEmail"
                      className="block text-xs font-medium text-neutral-800"
                    >
                      Admin Email *
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="owner@metronet.com"
                      className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contactPhone"
                      className="block text-xs font-medium text-neutral-800"
                    >
                      Phone Number
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+8801700112233"
                      className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="adminPassword"
                    className="block text-xs font-medium text-neutral-800"
                  >
                    Master Password (min 8 characters) *
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    required
                    minLength={8}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <button
                  id="onboarding-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-neutral-900 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      Create Organization & Continue <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-600">
          Already registered?{' '}
          <Link
            href="/login"
            className="font-semibold text-neutral-900 underline underline-offset-2"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
