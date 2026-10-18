import { describe, it, expect } from 'vitest';
import LoginPage from './login/page.js';
import OnboardingPage from './onboarding/page.js';
import AccessDeniedPage from './access-denied/page.js';
import StaffManagementPage from './dashboard/staff/page.js';
import RoutersPage from './dashboard/routers/page.js';
import PppoeSetupPage from './dashboard/routers/[id]/pppoe-setup/page.js';

describe('Auth, Staff, and Router Pages', () => {
  it('exports valid React components for auth, staff, and router management', () => {
    expect(typeof LoginPage).toBe('function');
    expect(typeof OnboardingPage).toBe('function');
    expect(typeof AccessDeniedPage).toBe('function');
    expect(typeof StaffManagementPage).toBe('function');
    expect(typeof RoutersPage).toBe('function');
    expect(typeof PppoeSetupPage).toBe('function');
  });
});

