'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Router as RouterIcon,
  Radio,
  Users,
  Package,
  Receipt,
  CreditCard,
  CalendarDays,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { getAuthToken, clearAuthToken } from '@/lib/api';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAVIGATION: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Routers', href: '/dashboard/routers', icon: RouterIcon },
      { name: 'PPPoE Sessions', href: '/dashboard/sessions', icon: Radio },
      { name: 'Subscribers', href: '/dashboard/subscribers', icon: Users },
      { name: 'Packages', href: '/dashboard/packages', icon: Package },
    ],
  },
  {
    title: 'Billing & Ledger',
    items: [
      { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
      { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
      { name: 'Billing Runs', href: '/dashboard/billing-runs', icon: CalendarDays },
    ],
  },
  {
    title: 'Management',
    items: [
      { name: 'SMS & Alerts', href: '/dashboard/notifications', icon: MessageSquare },
      { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      { name: 'Staff & Roles', href: '/dashboard/staff', icon: ShieldCheck },
      { name: 'Tenant Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function AppShell({ children, title, description, action }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('admin@fastnet.com');
  const [tenantName, setTenantName] = useState<string>('FastNet Broadband');

  useEffect(() => {
    // Read cached user or token details if stored
    const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed.email) setUserEmail(parsed.email);
        if (parsed.tenantName) setTenantName(parsed.tenantName);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-surface">
      <div className="flex flex-col space-y-6 p-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 border-b border-border pb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-900 text-white">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              {tenantName}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>MikroTik Sync Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5" aria-label="Sidebar Navigation">
          {NAVIGATION.map((section) => (
            <div key={section.title}>
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                {section.title}
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                              isActive
                                ? 'bg-neutral-700 text-neutral-200'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded border border-border bg-neutral-50/50 p-2">
          <div className="min-w-0 pr-2">
            <div className="truncate text-xs font-medium text-neutral-800">{userEmail}</div>
            <div className="text-[10px] text-neutral-500">Administrator</div>
          </div>
          <button
            id="signout-button"
            onClick={handleLogout}
            title="Sign Out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-surface shadow-xl">
            <div className="absolute right-2 top-2">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        {navContent}
      </aside>

      {/* Main Container */}
      <div className="flex flex-col lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded border border-border text-neutral-600 hover:bg-neutral-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="hidden font-medium text-neutral-900 sm:inline">ISP Core</span>
              <ChevronRight className="hidden h-3 w-3 sm:inline text-neutral-400" />
              <span className="font-semibold text-neutral-800">{title || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-600 sm:flex">
              <Activity className="h-3 w-3 text-emerald-600" />
              <span>API & Worker Online</span>
            </div>
            <Link
              href="/dashboard/routers"
              className="rounded border border-border bg-surface px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Routers
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {(title || action) && (
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                {title && <h1 className="text-xl font-bold tracking-tight text-neutral-900">{title}</h1>}
                {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
              </div>
              {action && <div className="flex items-center gap-2">{action}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
