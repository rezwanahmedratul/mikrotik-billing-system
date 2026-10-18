import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './client.js';
import argon2 from 'argon2';
import {
  UserRole,
  TenantStatus,
  RouterProtocol,
  RouterConnectionStatus,
  SubscriptionStatus,
  BillingCycle,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  SmsTemplateType,
  AuditAction,
} from '@mikrotik-billing/shared';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('[SAFETY ERROR] Seeding is forbidden in production environment.');
    process.exit(1);
  }

  console.log('[Seed] Starting idempotent development seed...');

  const passwordHash = await argon2.hash('Password123!');

  // 1. Platform Admin User
  const platformAdmin = await prisma.user.upsert({
    where: { email: 'platform.admin@example.com' },
    update: {},
    create: {
      email: 'platform.admin@example.com',
      fullName: 'Super Administrator',
      passwordHash,
      isActive: true,
    },
  });
  console.log('[Seed] Platform Admin:', platformAdmin.email);

  // 2. Primary Tenant: FastNet ISP
  const fastnetTenant = await prisma.tenant.upsert({
    where: { code: 'FASTNET' },
    update: {},
    create: {
      name: 'FastNet ISP Limited',
      code: 'FASTNET',
      contactEmail: 'contact@fastnet.com',
      contactPhone: '+8801711000111',
      status: TenantStatus.ACTIVE,
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
    },
  });

  // FastNet Staff Users
  const fastnetAdminUser = await prisma.user.upsert({
    where: { email: 'admin@fastnet.com' },
    update: {},
    create: {
      email: 'admin@fastnet.com',
      fullName: 'Ahsan Rahman (ISP Owner)',
      passwordHash,
      isActive: true,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: fastnetTenant.id,
        userId: fastnetAdminUser.id,
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      userId: fastnetAdminUser.id,
      role: UserRole.ISP_ADMIN,
    },
  });

  const fastnetOperator = await prisma.user.upsert({
    where: { email: 'operator@fastnet.com' },
    update: {},
    create: {
      email: 'operator@fastnet.com',
      fullName: 'Tanvir Hossain (NOC Support)',
      passwordHash,
      isActive: true,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: fastnetTenant.id,
        userId: fastnetOperator.id,
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      userId: fastnetOperator.id,
      role: UserRole.ISP_OPERATOR,
    },
  });

  const fastnetCashier = await prisma.user.upsert({
    where: { email: 'cashier@fastnet.com' },
    update: {},
    create: {
      email: 'cashier@fastnet.com',
      fullName: 'Salma Begum (Billing Staff)',
      passwordHash,
      isActive: true,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: fastnetTenant.id,
        userId: fastnetCashier.id,
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      userId: fastnetCashier.id,
      role: UserRole.CASHIER,
    },
  });

  // 3. Secondary Tenant: SkyLink Broadband (for tenant isolation verification)
  const skylinkTenant = await prisma.tenant.upsert({
    where: { code: 'SKYLINK' },
    update: {},
    create: {
      name: 'SkyLink Broadband',
      code: 'SKYLINK',
      contactEmail: 'support@skylink.com',
      contactPhone: '+8801911999888',
      status: TenantStatus.ACTIVE,
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
    },
  });

  const skylinkAdmin = await prisma.user.upsert({
    where: { email: 'admin@skylink.com' },
    update: {},
    create: {
      email: 'admin@skylink.com',
      fullName: 'Farhan Kabir (SkyLink Admin)',
      passwordHash,
      isActive: true,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: skylinkTenant.id,
        userId: skylinkAdmin.id,
      },
    },
    update: {},
    create: {
      tenantId: skylinkTenant.id,
      userId: skylinkAdmin.id,
      role: UserRole.ISP_ADMIN,
    },
  });

  // 4. FastNet Routers
  const coreRouter = await prisma.router.upsert({
    where: {
      tenantId_name: {
        tenantId: fastnetTenant.id,
        name: 'FastNet-Core-CCR2004',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      name: 'FastNet-Core-CCR2004',
      host: '10.0.0.1',
      port: 8728,
      protocol: RouterProtocol.REST_HTTPS,
      username: 'api_admin',
      encryptedPassword: 'mock_encrypted_router_secret_01',
      connectionStatus: RouterConnectionStatus.ONLINE,
      lastSeenAt: new Date(),
      rosVersion: 'RouterOS v7.14.3',
      uptime: '42d 18h 12m',
      cpuLoad: 18,
    },
  });

  const edgeRouter = await prisma.router.upsert({
    where: {
      tenantId_name: {
        tenantId: fastnetTenant.id,
        name: 'FastNet-Edge-RB4011',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      name: 'FastNet-Edge-RB4011',
      host: '10.0.1.1',
      port: 8728,
      protocol: RouterProtocol.REST_HTTPS,
      username: 'api_admin',
      encryptedPassword: 'mock_encrypted_router_secret_02',
      connectionStatus: RouterConnectionStatus.ONLINE,
      lastSeenAt: new Date(),
      rosVersion: 'RouterOS v7.14.1',
      uptime: '19d 06h 44m',
      cpuLoad: 24,
    },
  });

  // 5. FastNet Packages
  const pkgSilver = await prisma.package.upsert({
    where: {
      tenantId_code: {
        tenantId: fastnetTenant.id,
        code: 'SILVER_15M',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      name: 'Silver 15 Mbps',
      code: 'SILVER_15M',
      downloadSpeedKbps: 15360,
      uploadSpeedKbps: 15360,
      speedLimitRaw: '15M/15M',
      priceMinor: 100000, // BDT 1,000.00
      billingCycle: BillingCycle.MONTHLY,
      validityDays: 30,
      pppProfileName: 'profile_silver_15M',
      description: 'Standard residential high-speed broadband plan',
    },
  });

  const pkgGold = await prisma.package.upsert({
    where: {
      tenantId_code: {
        tenantId: fastnetTenant.id,
        code: 'GOLD_30M',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      name: 'Gold 30 Mbps',
      code: 'GOLD_30M',
      downloadSpeedKbps: 30720,
      uploadSpeedKbps: 30720,
      speedLimitRaw: '30M/30M',
      priceMinor: 150000, // BDT 1,500.00
      billingCycle: BillingCycle.MONTHLY,
      validityDays: 30,
      pppProfileName: 'profile_gold_30M',
      description: 'Premium gaming and 4K streaming broadband plan',
    },
  });

  // 6. FastNet Subscribers, Subscriptions & PPPoE Accounts
  const sub1 = await prisma.subscriber.upsert({
    where: {
      tenantId_accountNumber: {
        tenantId: fastnetTenant.id,
        accountNumber: 'FN-10001',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      accountNumber: 'FN-10001',
      fullName: 'Kamal Uddin',
      phone: '+8801712345678',
      email: 'kamal.uddin@example.com',
      address: 'House 42, Road 11, Banani, Dhaka',
    },
  });

  const sub2 = await prisma.subscriber.upsert({
    where: {
      tenantId_accountNumber: {
        tenantId: fastnetTenant.id,
        accountNumber: 'FN-10002',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      accountNumber: 'FN-10002',
      fullName: 'Nusrat Jahan',
      phone: '+8801812345678',
      email: 'nusrat.jahan@example.com',
      address: 'Apartment 5B, Green Valley, Dhanmondi, Dhaka',
    },
  });

  // PPPoE Secrets
  await prisma.pppoeAccount.upsert({
    where: {
      tenantId_username: {
        tenantId: fastnetTenant.id,
        username: 'kamal_fastnet',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      subscriberId: sub1.id,
      routerId: coreRouter.id,
      username: 'kamal_fastnet',
      encryptedPassword: 'mock_encrypted_pppoe_password_01',
      pppProfile: pkgSilver.pppProfileName,
      staticIp: '192.168.100.25',
      isSuspended: false,
    },
  });

  await prisma.pppoeAccount.upsert({
    where: {
      tenantId_username: {
        tenantId: fastnetTenant.id,
        username: 'nusrat_fastnet',
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      subscriberId: sub2.id,
      routerId: coreRouter.id,
      username: 'nusrat_fastnet',
      encryptedPassword: 'mock_encrypted_pppoe_password_02',
      pppProfile: pkgGold.pppProfileName,
      staticIp: '192.168.100.26',
      isSuspended: false,
    },
  });

  // Subscriptions
  let sub1Subscription = await prisma.subscription.findFirst({
    where: {
      tenantId: fastnetTenant.id,
      subscriberId: sub1.id,
    },
  });

  if (!sub1Subscription) {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    sub1Subscription = await prisma.subscription.create({
      data: {
        tenantId: fastnetTenant.id,
        subscriberId: sub1.id,
        packageId: pkgSilver.id,
        routerId: coreRouter.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        expiryDate: nextMonth,
        lastBilledAt: now,
      },
    });
  }

  // 7. Initial Invoice and Payment for Kamal
  let invoice1 = await prisma.invoice.findUnique({
    where: {
      tenantId_invoiceNumber: {
        tenantId: fastnetTenant.id,
        invoiceNumber: 'INV-2026-0001',
      },
    },
  });

  if (!invoice1) {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    invoice1 = await prisma.invoice.create({
      data: {
        tenantId: fastnetTenant.id,
        subscriberId: sub1.id,
        subscriptionId: sub1Subscription.id,
        invoiceNumber: 'INV-2026-0001',
        billingPeriodStart: now,
        billingPeriodEnd: nextMonth,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        subtotalMinor: 100000,
        discountMinor: 0,
        taxMinor: 0,
        totalMinor: 100000,
        paidAmountMinor: 100000,
        balanceMinor: 0,
        status: InvoiceStatus.PAID,
        paidAt: now,
        lines: {
          create: [
            {
              description: 'Silver 15 Mbps Broadband Service (Monthly)',
              quantity: 1,
              unitPriceMinor: 100000,
              totalMinor: 100000,
            },
          ],
        },
      },
    });
  }

  const existingPayment = await prisma.payment.findUnique({
    where: {
      tenantId_paymentNumber: {
        tenantId: fastnetTenant.id,
        paymentNumber: 'RCP-2026-0001',
      },
    },
  });

  if (!existingPayment && invoice1) {
    await prisma.payment.create({
      data: {
        tenantId: fastnetTenant.id,
        subscriberId: sub1.id,
        paymentNumber: 'RCP-2026-0001',
        amountMinor: 100000,
        currency: 'BDT',
        method: PaymentMethod.BKASH,
        status: PaymentStatus.CONFIRMED,
        externalReference: 'BKH9988776655',
        collectedBy: 'FastNet Online Gateway',
        allocations: {
          create: [
            {
              invoiceId: invoice1.id,
              amountMinor: 100000,
            },
          ],
        },
      },
    });
  }

  // 8. Notification Templates
  await prisma.notificationTemplate.upsert({
    where: {
      tenantId_type: {
        tenantId: fastnetTenant.id,
        type: SmsTemplateType.INVOICE_ISSUED,
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      type: SmsTemplateType.INVOICE_ISSUED,
      name: 'Invoice Issued Notice',
      templateText:
        'Dear {{subscriberName}}, your invoice #{{invoiceNumber}} for BDT {{amount}} has been issued. Due date: {{dueDate}}.',
    },
  });

  await prisma.notificationTemplate.upsert({
    where: {
      tenantId_type: {
        tenantId: fastnetTenant.id,
        type: SmsTemplateType.PAYMENT_RECEIVED,
      },
    },
    update: {},
    create: {
      tenantId: fastnetTenant.id,
      type: SmsTemplateType.PAYMENT_RECEIVED,
      name: 'Payment Receipt Confirmation',
      templateText:
        'Dear {{subscriberName}}, we received payment of BDT {{amount}} (Ref: {{paymentNumber}}). Thank you for being with FastNet!',
    },
  });

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      tenantId: fastnetTenant.id,
      userId: fastnetAdminUser.id,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'System',
      entityId: fastnetTenant.id,
      details: { note: 'Initial tenant environment configured via development seed' },
    },
  });

  console.log('[Seed] Development seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
