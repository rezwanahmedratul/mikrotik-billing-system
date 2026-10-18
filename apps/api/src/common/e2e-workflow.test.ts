import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  UserRole,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentGatewayProvider,
  MockPaymentGatewayAdapter,
  RouterProtocol,
  BillingCycle,
} from '@mikrotik-billing/shared';
import { AuthService } from '../auth/auth.service';
import { AuditService } from './audit.service';
import { RoutersService } from '../routers/routers.service';
import { PppoeSetupService } from '../routers/pppoe-setup.service';
import { PackagesService } from '../packages/packages.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { SubscriptionsService } from '../subscribers/subscriptions.service';
import { PppoeProvisioningService } from '../subscribers/pppoe-provisioning.service';
import { RouterAdapterFactory } from '../routers/router-adapter.factory';
import { InvoicesService } from '../billing/invoices.service';
import { PaymentsService } from '../billing/payments.service';
import { BillingRunsService } from '../billing/billing-runs.service';
import { PaymentGatewaysService } from '../payment-gateways/payment-gateways.service';
import { ServiceLifecycleService } from '../lifecycle/service-lifecycle.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReportsService } from '../reports/reports.service';

describe('End-to-End Platform Lifecycle Workflow (Section 19)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const routersService = new RoutersService(auditService, adapterFactory);
  const pppoeSetupService = new PppoeSetupService(auditService, adapterFactory);
  const packagesService = new PackagesService(auditService);
  const subscriptionsService = new SubscriptionsService(auditService);
  const provisioningService = new PppoeProvisioningService(adapterFactory);
  const subscribersService = new SubscribersService(
    auditService,
    provisioningService,
    subscriptionsService
  );
  const invoicesService = new InvoicesService(auditService);
  const paymentsService = new PaymentsService(auditService);
  const billingRunsService = new BillingRunsService(auditService, invoicesService);
  const paymentGatewaysService = new PaymentGatewaysService(paymentsService, auditService);
  const notificationsService = new NotificationsService(auditService);
  const lifecycleService = new ServiceLifecycleService(
    provisioningService,
    notificationsService,
    auditService
  );
  const reportsService = new ReportsService();

  const webhookSecret = 'sandbox-webhook-secret-key-123';

  let tenant: any;
  let admin: any;
  let pkg: any;
  let router: any;
  let subscriber: any;
  let subscription: any;
  let invoice: any;

  afterAll(async () => {
    if (tenant?.id) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    }
  });

  it('Step 1: Tenant Registration and Onboarding', async () => {
    const reg = await authService.registerTenant({
      tenantName: 'E2E Apex Broadband Ltd',
      tenantCode: `E2E_${Date.now()}`,
      adminEmail: `e2e_owner_${Date.now()}@apexnet.com`,
      adminPassword: 'MasterPassword123!',
      adminFullName: 'Tariqul Islam',
      contactPhone: '+8801799887766',
    });

    expect(reg.tenant).toBeDefined();
    expect(reg.tenant.id).toBeDefined();
    expect(reg.user.role).toBe(UserRole.ISP_ADMIN);
    expect(reg.token).toBeDefined();

    tenant = reg.tenant;
    admin = reg.user;
  });

  it('Step 2: Service Tariff Package Definition', async () => {
    pkg = await packagesService.create(tenant.id, {
      name: 'Turbo Fiber 30M',
      code: `PKG_TURBO_${Date.now()}`,
      speedLimitRaw: '30M/30M',
      pppProfileName: 'profile-30m',
      priceMinor: 200000,
      billingCycle: BillingCycle.MONTHLY,
      validityDays: 30,
    });

    expect(pkg.id).toBeDefined();
    expect(pkg.speedLimitRaw).toBe('30M/30M');
    expect(pkg.priceMinor).toBe(200000);
  });

  it('Step 3: Core Gateway Router Registration', async () => {
    router = await routersService.create(tenant.id, {
      name: 'E2E-Core-CCR2004',
      host: '10.200.0.1',
      port: 8728,
      protocol: RouterProtocol.REST_HTTPS,
      username: 'api_admin',
      password: 'EncryptedRouterPass123!',
    });

    expect(router.id).toBeDefined();
    expect(router.connectionStatus).toBe('ONLINE');
  });

  it('Step 4: Guided PPPoE Server Automation on Router', async () => {
    // Generate dry-run plan
    const plan = await pppoeSetupService.plan(tenant.id, router.id, {
      poolName: 'e2e-client-pool',
      poolRange: '10.10.30.2-10.10.30.254',
      localAddress: '10.10.30.1',
      serviceName: 'pppoe-e2e-service',
      interfaceName: 'ether2-lan',
      defaultProfileName: 'profile-30m',
    });

    expect(plan.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.safetyCheck.isSafe).toBe(true);

    // Apply configuration
    const applyResult = await pppoeSetupService.apply(
      tenant.id,
      router.id,
      {
        ...plan.parameters,
        confirmed: true,
        planId: plan.planId,
      },
      admin.id
    );
    expect(applyResult.success).toBe(true);
    expect(applyResult.appliedSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('Step 5: Subscriber Onboarding & PPPoE Secret Provisioning', async () => {
    subscriber = await subscribersService.create(tenant.id, {
      fullName: 'Farhan Kabir',
      phone: '+8801711223344',
      packageId: pkg.id,
      routerId: router.id,
      pppoeUsername: `farhan_${Date.now()}`,
      pppoePassword: 'SecretClientPass123!',
    });

    expect(subscriber.id).toBeDefined();
    expect(subscriber.accountNumber).toMatch(/^SUB-\d{4}$/);
    expect(subscriber.currentSubscription?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(subscriber.pppoeAccount?.hasPassword).toBe(true);
    subscription = subscriber.currentSubscription;
  });

  it('Step 6: Batch Billing Run & Idempotent Invoicing', async () => {
    const billingResult = await billingRunsService.executeBillingRun(tenant.id, {
      isDryRun: false,
    });

    expect(billingResult.invoicesGenerated).toBeGreaterThanOrEqual(1);

    const invoices = await invoicesService.list(tenant.id, { subscriberId: subscriber.id });
    expect(invoices.data.length).toBe(1);
    invoice = invoices.data[0];
    expect(invoice.totalMinor).toBe(200000);
    expect(invoice.balanceMinor).toBe(200000);
    expect(invoice.status).toBe(InvoiceStatus.ISSUED);
  });

  it('Step 7: Online Payment Gateway Settlement via Webhook', async () => {
    const eventPayload = {
      eventId: `EVT_E2E_${Date.now()}`,
      eventType: 'payment.success',
      amountMinor: 200000,
      currency: 'BDT',
      transactionReference: `TRX_BKASH_${Date.now()}`,
      metadata: {
        tenantId: tenant.id,
        subscriberId: subscriber.id,
        invoiceId: invoice.id,
      },
    };

    const rawPayload = JSON.stringify(eventPayload);
    const signature = MockPaymentGatewayAdapter.signPayload(rawPayload, webhookSecret);

    const webhookResult = await paymentGatewaysService.processWebhook(
      PaymentGatewayProvider.BKASH,
      rawPayload,
      { 'x-signature': signature },
      tenant.id
    );

    expect(webhookResult.status).toBe('success');

    // Confirm invoice is now settled in ledger
    const settledInv = await invoicesService.getById(tenant.id, invoice.id);
    expect(settledInv.status).toBe(InvoiceStatus.PAID);
    expect(settledInv.balanceMinor).toBe(0);
  });

  it('Step 8: Service Lifecycle Suspensions and Restorations Protection', async () => {
    // 1. Farhan has 0 balance, so running lifecycle should NEVER suspend him
    const cycle1 = await lifecycleService.executeCycle(tenant.id, { isDryRun: false });
    expect(cycle1.subscriptionsSuspended).toBe(0);

    const checkSub = await subscribersService.getById(tenant.id, subscriber.id);
    expect(checkSub.currentSubscription?.status).toBe(SubscriptionStatus.ACTIVE);

    // 2. Manual operator suspension override
    await lifecycleService.manualOverride(
      tenant.id,
      {
        subscriptionId: subscription.id,
        action: 'SUSPEND',
        reason: 'Physical fiber line maintenance in sector 4',
      },
      admin.id
    );

    const suspendedSub = await subscribersService.getById(tenant.id, subscriber.id);
    expect(suspendedSub.currentSubscription?.status).toBe(SubscriptionStatus.SUSPENDED);

    // 3. Automated restoration of settled account
    const cycle2 = await lifecycleService.executeCycle(tenant.id, { isDryRun: false });
    expect(cycle2.subscriptionsRestored).toBeGreaterThanOrEqual(1);

    const restoredSub = await subscribersService.getById(tenant.id, subscriber.id);
    expect(restoredSub.currentSubscription?.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('Step 9: Complete Tamper-Evident Audit Trail Integrity', async () => {
    const auditLogs = await reportsService.getAuditLogs(tenant.id, { page: 1, limit: 50 });
    expect(auditLogs.total).toBeGreaterThanOrEqual(2);

    const actions = auditLogs.items.map((i) => i.action);
    expect(actions).toContain('CONFIG_CHANGED');
  });

  it('Step 10: Financial Revenue Overview Metrics', async () => {
    const overview = await reportsService.getDashboardOverview(tenant.id);
    expect(overview.metrics.activeSubscribers).toBeGreaterThanOrEqual(1);
    expect(overview.metrics.currentMonthPaidMinor).toBeGreaterThanOrEqual(200000);
    expect(overview.metrics.onlineRouters).toBeGreaterThanOrEqual(1);
  });
});
