import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from './auth.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import { AuditService } from '../common/audit.service.js';
import { prisma } from '@mikrotik-billing/database';
import { UserRole } from '@mikrotik-billing/shared';
import jwt from 'jsonwebtoken';

describe('Authentication, Tenant Isolation & RBAC', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const tenantsService = new TenantsService(auditService);

  let tenantA: any;
  let tenantB: any;
  let adminA: any;
  let cashierA: any;
  let adminB: any;

  beforeAll(async () => {
    // Register Tenant A
    const regA = await authService.registerTenant({
      tenantName: 'Auth Test Tenant A',
      tenantCode: `TA_${Date.now()}`,
      adminEmail: `admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Alice Administrator',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    // Add a Cashier to Tenant A
    cashierA = await tenantsService.createStaff(
      tenantA.id,
      {
        email: `cashier_a_${Date.now()}@example.com`,
        fullName: 'Charlie Cashier',
        role: UserRole.CASHIER,
        password: 'Password123!',
      },
      adminA.id
    );

    // Register Tenant B
    const regB = await authService.registerTenant({
      tenantName: 'Auth Test Tenant B',
      tenantCode: `TB_${Date.now()}`,
      adminEmail: `admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Bob Administrator',
    });
    tenantB = regB.tenant;
    adminB = regB.user;
  });

  afterAll(async () => {
    if (tenantA?.id) {
      await prisma.tenant.delete({ where: { id: tenantA.id } }).catch(() => {});
    }
    if (tenantB?.id) {
      await prisma.tenant.delete({ where: { id: tenantB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('authenticates valid credentials and returns a valid JWT with tenant context', async () => {
    const res = await authService.login({
      email: adminA.email,
      password: 'Password123!',
    });

    expect(res.token).toBeDefined();
    expect(res.user.email).toBe(adminA.email);
    expect(res.user.role).toBe(UserRole.ISP_ADMIN);
    expect(res.tenant.id).toBe(tenantA.id);

    // Verify token claims
    const decoded: any = jwt.decode(res.token);
    expect(decoded.sub).toBe(adminA.id);
    expect(decoded.tenantId).toBe(tenantA.id);
    expect(decoded.role).toBe(UserRole.ISP_ADMIN);
  });

  it('rejects login with invalid password', async () => {
    await expect(
      authService.login({
        email: adminA.email,
        password: 'WrongPassword!',
      })
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects login with nonexistent email without leaking user existence', async () => {
    await expect(
      authService.login({
        email: 'nonexistent_user_999@example.com',
        password: 'SomePassword123!',
      })
    ).rejects.toThrow('Invalid email or password');
  });

  it('enforces brute force login throttling after 5 failed attempts', async () => {
    const targetEmail = `throttle_test_${Date.now()}@example.com`;
    const ip = '192.168.1.100';

    for (let i = 0; i < 5; i++) {
      await expect(
        authService.login({ email: targetEmail, password: 'WrongPassword!' }, ip)
      ).rejects.toThrow();
    }

    // 6th attempt should be blocked with rate limit error
    await expect(
      authService.login({ email: targetEmail, password: 'WrongPassword!' }, ip)
    ).rejects.toThrow(/Too many consecutive failed login attempts/);
  });

  it('retrieves sanitized current user profile without exposing password hashes', async () => {
    const profile = await authService.getMe(adminA.id, tenantA.id);
    expect(profile.user.id).toBe(adminA.id);
    expect(profile.user.email).toBe(adminA.email);
    expect((profile.user as any).passwordHash).toBeUndefined();
    expect(profile.tenant?.id).toBe(tenantA.id);
  });

  it('prevents cross-tenant access: Tenant B cannot list or modify Tenant A staff', async () => {
    // Tenant A staff list
    const staffListA = await tenantsService.listStaff(tenantA.id);
    expect(staffListA.length).toBeGreaterThanOrEqual(2); // Admin and Cashier

    // Tenant B cannot modify Tenant A's cashier membership
    const cashierMembershipId = cashierA.membershipId;
    await expect(
      tenantsService.updateStaff(
        tenantB.id, // Trying to update under Tenant B context
        cashierMembershipId,
        { role: UserRole.ISP_OPERATOR },
        adminB.id
      )
    ).rejects.toThrow('Staff member not found in this organization');
  });

  it('prevents removing the only remaining organization administrator', async () => {
    // Find admin membership
    const staffList = await tenantsService.listStaff(tenantA.id);
    const adminMembership = staffList.find((s) => s.role === UserRole.ISP_ADMIN);
    expect(adminMembership).toBeDefined();

    await expect(
      tenantsService.removeStaff(tenantA.id, adminMembership!.membershipId, 'other-user-id')
    ).rejects.toThrow('Cannot remove the only remaining organization administrator');
  });
});
