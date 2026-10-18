import { describe, it, expect } from 'vitest';
import {
  UserRole,
  RoleHierarchy,
  formatCurrency,
  parseCurrencyToMinor,
  SpeedLimitSchema,
} from './index.js';

describe('Shared domain constants and utilities', () => {
  it('correctly assesses role hierarchy', () => {
    expect(RoleHierarchy[UserRole.PLATFORM_ADMIN]).toBeGreaterThan(
      RoleHierarchy[UserRole.ISP_ADMIN]
    );
    expect(RoleHierarchy[UserRole.ISP_ADMIN]).toBeGreaterThan(RoleHierarchy[UserRole.ISP_OPERATOR]);
    expect(RoleHierarchy[UserRole.ISP_OPERATOR]).toBeGreaterThan(RoleHierarchy[UserRole.CASHIER]);
    expect(RoleHierarchy[UserRole.CASHIER]).toBeGreaterThan(RoleHierarchy[UserRole.AUDITOR]);
  });

  it('correctly formats and parses monetary minor units', () => {
    expect(formatCurrency(150000, 'BDT')).toBe('BDT 1500.00');
    expect(formatCurrency(50, 'BDT')).toBe('BDT 0.50');
    expect(parseCurrencyToMinor(1500)).toBe(150000);
    expect(parseCurrencyToMinor('12.50')).toBe(1250);
  });

  it('validates speed limit formats', () => {
    expect(SpeedLimitSchema.safeParse('10M/10M').success).toBe(true);
    expect(SpeedLimitSchema.safeParse('2048k/4096k').success).toBe(true);
    expect(SpeedLimitSchema.safeParse('invalid-speed').success).toBe(false);
  });
});
