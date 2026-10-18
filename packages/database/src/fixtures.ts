import { prisma } from './client.js';
import argon2 from 'argon2';
import {
  UserRole,
  RouterProtocol,
  RouterConnectionStatus,
  SubscriptionStatus,
  BillingCycle,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  SmsTemplateType,
} from '@mikrotik-billing/shared';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export async function createTestTenant(codePrefix = 'TEST') {
  const uniqueCode = `${codePrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return prisma.tenant.create({
    data: {
      name: `Test Tenant ${uniqueCode}`,
      code: uniqueCode,
      contactEmail: `${uniqueCode.toLowerCase()}@example.com`,
      contactPhone: '+8801700000000',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
    },
  });
}

export async function createTestUser(
  emailPrefix = 'user',
  role = UserRole.ISP_OPERATOR,
  tenantId?: string
) {
  const email = `${emailPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
  const passwordHash = await hashPassword('Password123!');
  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'Test Operator',
      passwordHash,
      isActive: true,
    },
  });

  if (tenantId) {
    await prisma.tenantMembership.create({
      data: {
        tenantId,
        userId: user.id,
        role,
        isActive: true,
      },
    });
  }

  return user;
}

export async function createTestRouter(tenantId: string, name = 'Test-Router') {
  const uniqueName = `${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return prisma.router.create({
    data: {
      tenantId,
      name: uniqueName,
      host: '192.168.88.1',
      port: 8728,
      protocol: RouterProtocol.REST_HTTPS,
      username: 'admin',
      encryptedPassword: 'encrypted_test_password',
      connectionStatus: RouterConnectionStatus.ONLINE,
      rosVersion: '7.14.3',
      uptime: '15d 4h 22m',
      cpuLoad: 12,
    },
  });
}

export async function createTestPackage(tenantId: string, code = 'PKG_TEST', priceMinor = 150000) {
  const uniqueCode = `${code}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  return prisma.package.create({
    data: {
      tenantId,
      name: `Package ${uniqueCode}`,
      code: uniqueCode,
      downloadSpeedKbps: 20480,
      uploadSpeedKbps: 20480,
      speedLimitRaw: '20M/20M',
      priceMinor,
      billingCycle: BillingCycle.MONTHLY,
      validityDays: 30,
      pppProfileName: 'profile_20M',
    },
  });
}

export async function createTestSubscriber(tenantId: string, accountPrefix = 'SUB') {
  const accountNumber = `${accountPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return prisma.subscriber.create({
    data: {
      tenantId,
      accountNumber,
      fullName: 'John Doe Customer',
      phone: '+8801800000000',
      email: `${accountNumber.toLowerCase()}@example.com`,
      address: 'House 12, Road 4, Sector 7, Uttara, Dhaka',
    },
  });
}
