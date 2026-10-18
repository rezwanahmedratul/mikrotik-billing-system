import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@mikrotik-billing/database';
import { AuditAction } from '@mikrotik-billing/shared';
import {
  DashboardOverviewDto,
  CollectionsReportQueryDto,
  CollectionsReportDto,
  SubscriberGrowthQueryDto,
  SubscriberGrowthReportDto,
  AgingReportDto,
  RouterHealthReportDto,
  AuditLogQueryDto,
  AuditLogListResultDto,
} from './reports.dto';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

@Injectable()
export class ReportsService {
  // Short-lived in-memory cache for high-frequency dashboard overview requests
  private dashboardCache = new Map<string, CacheEntry<DashboardOverviewDto>>();
  private readonly CACHE_TTL_MS = 15000; // 15 seconds

  /**
   * Generates or retrieves cached operational dashboard metrics.
   * Satisfies requirement: Does not query external routers synchronously.
   */
  async getDashboardOverview(tenantId: string): Promise<DashboardOverviewDto> {
    const cached = this.dashboardCache.get(tenantId);
    const now = Date.now();

    if (cached && now - cached.cachedAt < this.CACHE_TTL_MS) {
      return {
        ...cached.data,
        dataFreshness: {
          timestamp: new Date(cached.cachedAt).toISOString(),
          isCached: true,
          ttlSeconds: Math.round((this.CACHE_TTL_MS - (now - cached.cachedAt)) / 1000),
        },
      };
    }

    // 1. Subscriber Counts
    const [totalSubscribers, activeSubscriptions, suspendedSubscriptions] = await Promise.all([
      prisma.subscriber.count({ where: { tenantId } }),
      prisma.subscription.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { tenantId, status: 'SUSPENDED' } }),
    ]);

    // 2. Router status & Active PPPoE sessions
    const routers = await prisma.router.findMany({
      where: { tenantId, isArchived: false },
      select: {
        id: true,
        connectionStatus: true,
        cpuLoad: true,
        _count: {
          select: {
            pppoeAccounts: {
              where: {
                isSuspended: false,
              },
            },
          },
        },
      },
    });

    const onlineRouters = routers.filter((r) => r.connectionStatus === 'ONLINE').length;
    const totalRouters = routers.length;

    // Estimated active sessions from active accounts
    const onlineSessions = routers.reduce((sum, r) => sum + r._count.pppoeAccounts, 0);

    // 3. Billing & Collections (Current Month window)
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [billedAgg, paidAgg, outstandingAgg, overdueCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          issuedAt: { gte: startOfMonth },
          status: { not: 'VOID' },
        },
        _sum: { totalMinor: true },
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          status: 'CONFIRMED',
        },
        _sum: { amountMinor: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          balanceMinor: { gt: 0 },
          status: { not: 'VOID' },
        },
        _sum: { balanceMinor: true },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          balanceMinor: { gt: 0 },
          dueDate: { lt: new Date() },
          status: { not: 'VOID' },
        },
      }),
    ]);

    // 4. Recent audit activity trail (last 8 actions)
    const recentLogs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const recentActivity = recentLogs.map((log) => ({
      id: log.id,
      action: log.action as string,
      entityType: log.entityType,
      entityId: log.entityId,
      actor: log.user ? log.user.fullName : 'System Automation',
      createdAt: log.createdAt.toISOString(),
      details: (log.details as Record<string, unknown>) || undefined,
    }));

    const result: DashboardOverviewDto = {
      metrics: {
        activeSubscribers: activeSubscriptions,
        suspendedSubscribers: suspendedSubscriptions,
        totalSubscribers,
        onlineSessions,
        onlineRouters,
        totalRouters,
        currentMonthBilledMinor: billedAgg._sum?.totalMinor ?? 0,
        currentMonthPaidMinor: paidAgg._sum?.amountMinor ?? 0,
        outstandingDueMinor: outstandingAgg._sum?.balanceMinor ?? 0,
        overdueInvoicesCount: overdueCount,
      },
      recentActivity,
      dataFreshness: {
        timestamp: new Date().toISOString(),
        isCached: false,
        ttlSeconds: Math.round(this.CACHE_TTL_MS / 1000),
      },
    };

    // Cache the fresh result
    this.dashboardCache.set(tenantId, {
      data: result,
      cachedAt: now,
    });

    return result;
  }

  /**
   * Financial Collections & Reversals Report
   */
  async getCollectionsReport(
    tenantId: string,
    query: CollectionsReportQueryDto = {}
  ): Promise<CollectionsReportDto> {
    const where: Prisma.PaymentWhereInput = {
      tenantId,
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.method && query.method !== 'ALL') {
      where.method = query.method as any;
    }

    if (query.cashierId) {
      where.collectedBy = query.cashierId;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    let grossCollectedMinor = 0;
    let reversalsMinor = 0;
    const byMethod: Record<string, { count: number; totalMinor: number }> = {};
    const cashierMap = new Map<
      string,
      { cashierId: string; cashierName: string; count: number; totalMinor: number }
    >();
    const dailyMap = new Map<
      string,
      { date: string; grossMinor: number; reversalsMinor: number; netMinor: number; count: number }
    >();

    for (const p of payments) {
      const dateKey = p.createdAt.toISOString().slice(0, 10);
      const dayEntry = dailyMap.get(dateKey) || {
        date: dateKey,
        grossMinor: 0,
        reversalsMinor: 0,
        netMinor: 0,
        count: 0,
      };

      if (p.status === 'CONFIRMED') {
        grossCollectedMinor += p.amountMinor;
        dayEntry.grossMinor += p.amountMinor;
        dayEntry.netMinor += p.amountMinor;
        dayEntry.count += 1;

        // Method breakdown
        const methodKey = p.method;
        const currentMethod = byMethod[methodKey] || { count: 0, totalMinor: 0 };
        currentMethod.count += 1;
        currentMethod.totalMinor += p.amountMinor;
        byMethod[methodKey] = currentMethod;

        // Cashier breakdown
        const cashierId = p.collectedBy || 'system';
        const cashierName = p.collectedBy || 'System / Online';
        const currentCashier = cashierMap.get(cashierId) || {
          cashierId,
          cashierName,
          count: 0,
          totalMinor: 0,
        };
        currentCashier.count += 1;
        currentCashier.totalMinor += p.amountMinor;
        cashierMap.set(cashierId, currentCashier);
      } else if (p.status === 'REVERSED') {
        reversalsMinor += p.amountMinor;
        dayEntry.reversalsMinor += p.amountMinor;
        dayEntry.netMinor -= p.amountMinor;
        dayEntry.count += 1;
      }

      dailyMap.set(dateKey, dayEntry);
    }

    return {
      grossCollectedMinor,
      reversalsMinor,
      netCollectedMinor: grossCollectedMinor - reversalsMinor,
      totalTransactionsCount: payments.length,
      byMethod,
      byCashier: Array.from(cashierMap.values()),
      dailyTrend: Array.from(dailyMap.values()),
    };
  }

  /**
   * Subscriber Growth and Distribution Report
   */
  async getSubscriberGrowthReport(
    tenantId: string,
    query: SubscriberGrowthQueryDto = {}
  ): Promise<SubscriberGrowthReportDto> {
    const [totalCount, activeCount, suspendedCount] = await Promise.all([
      prisma.subscriber.count({ where: { tenantId } }),
      prisma.subscription.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { tenantId, status: 'SUSPENDED' } }),
    ]);

    // Count new subscribers in window
    let newWhere: Prisma.SubscriberWhereInput = { tenantId };
    if (query.startDate || query.endDate) {
      newWhere.createdAt = {};
      if (query.startDate) newWhere.createdAt.gte = new Date(query.startDate);
      if (query.endDate) newWhere.createdAt.lte = new Date(query.endDate);
    }
    const newSubscribersInPeriod = await prisma.subscriber.count({ where: newWhere });

    // Package distribution
    const packages = await prisma.package.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        downloadSpeedKbps: true,
        uploadSpeedKbps: true,
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    const byPackage = packages.map((pkg) => ({
      packageId: pkg.id,
      packageName: pkg.name,
      speedDesc: `${Math.round(pkg.downloadSpeedKbps / 1024)}M / ${Math.round(
        pkg.uploadSpeedKbps / 1024
      )}M`,
      count: pkg._count.subscriptions,
    }));

    // Router distribution
    const routers = await prisma.router.findMany({
      where: { tenantId, isArchived: false },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            pppoeAccounts: true,
          },
        },
      },
    });

    const byRouter = routers.map((r) => ({
      routerId: r.id,
      routerName: r.name,
      count: r._count.pppoeAccounts,
    }));

    return {
      totalCount,
      activeCount,
      suspendedCount,
      newSubscribersInPeriod,
      byPackage,
      byRouter,
    };
  }

  /**
   * Invoices and Overdue Aging Report
   */
  async getAgingReport(tenantId: string): Promise<AgingReportDto> {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        balanceMinor: { gt: 0 },
        status: { not: 'VOID' },
      },
      include: {
        subscriber: {
          select: {
            id: true,
            fullName: true,
            accountNumber: true,
            phone: true,
          },
        },
      },
    });

    const now = Date.now();
    let totalOutstandingMinor = 0;
    let totalOverdueCount = 0;

    const buckets = {
      current: { count: 0, totalMinor: 0 },
      days1to30: { count: 0, totalMinor: 0 },
      days31to60: { count: 0, totalMinor: 0 },
      days61to90: { count: 0, totalMinor: 0 },
      days90Plus: { count: 0, totalMinor: 0 },
    };

    const debtorsMap = new Map<
      string,
      {
        subscriberId: string;
        subscriberName: string;
        accountNumber: string;
        phone: string;
        invoiceCount: number;
        balanceMinor: number;
        oldestDueDate: string;
        daysOverdue: number;
      }
    >();

    for (const inv of unpaidInvoices) {
      totalOutstandingMinor += inv.balanceMinor;
      const dueTime = new Date(inv.dueDate).getTime();
      const diffMs = now - dueTime;
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        buckets.current.count += 1;
        buckets.current.totalMinor += inv.balanceMinor;
      } else {
        totalOverdueCount += 1;
        if (daysOverdue <= 30) {
          buckets.days1to30.count += 1;
          buckets.days1to30.totalMinor += inv.balanceMinor;
        } else if (daysOverdue <= 60) {
          buckets.days31to60.count += 1;
          buckets.days31to60.totalMinor += inv.balanceMinor;
        } else if (daysOverdue <= 90) {
          buckets.days61to90.count += 1;
          buckets.days61to90.totalMinor += inv.balanceMinor;
        } else {
          buckets.days90Plus.count += 1;
          buckets.days90Plus.totalMinor += inv.balanceMinor;
        }
      }

      if (inv.subscriber) {
        const subId = inv.subscriber.id;
        const currentDebtor = debtorsMap.get(subId) || {
          subscriberId: subId,
          subscriberName: inv.subscriber.fullName,
          accountNumber: inv.subscriber.accountNumber,
          phone: inv.subscriber.phone,
          invoiceCount: 0,
          balanceMinor: 0,
          oldestDueDate: inv.dueDate.toISOString(),
          daysOverdue: Math.max(0, daysOverdue),
        };

        currentDebtor.invoiceCount += 1;
        currentDebtor.balanceMinor += inv.balanceMinor;
        if (new Date(inv.dueDate) < new Date(currentDebtor.oldestDueDate)) {
          currentDebtor.oldestDueDate = inv.dueDate.toISOString();
        }
        currentDebtor.daysOverdue = Math.max(currentDebtor.daysOverdue, daysOverdue);
        debtorsMap.set(subId, currentDebtor);
      }
    }

    const topDebtors = Array.from(debtorsMap.values())
      .sort((a, b) => b.balanceMinor - a.balanceMinor)
      .slice(0, 15);

    return {
      totalOutstandingMinor,
      totalOverdueCount,
      buckets,
      topDebtors,
    };
  }

  /**
   * Router Gateways Health & Telemetry Summary
   */
  async getRouterHealthReport(tenantId: string): Promise<RouterHealthReportDto> {
    const routers = await prisma.router.findMany({
      where: { tenantId, isArchived: false },
      include: {
        _count: {
          select: {
            pppoeAccounts: true,
          },
        },
      },
    });

    const now = Date.now();
    let totalCpu = 0;
    let cpuCount = 0;
    let onlineCount = 0;
    let offlineCount = 0;
    let totalSessions = 0;

    const routerList = routers.map((r) => {
      const isOnline = r.connectionStatus === 'ONLINE';
      if (isOnline) onlineCount += 1;
      else offlineCount += 1;

      if (r.cpuLoad !== null) {
        totalCpu += r.cpuLoad;
        cpuCount += 1;
      }

      const activeSessions = r._count.pppoeAccounts;
      totalSessions += activeSessions;

      const isStale = r.lastSeenAt
        ? now - new Date(r.lastSeenAt).getTime() > 5 * 60 * 1000
        : true;

      return {
        id: r.id,
        name: r.name,
        host: `${r.host}:${r.port}`,
        status: r.connectionStatus as string,
        cpuLoad: r.cpuLoad,
        memoryFree: r.memoryFree !== null ? Number(r.memoryFree) : null,
        memoryTotal: null,
        uptime: r.uptime,
        rosVersion: r.rosVersion,
        activeSessions,
        lastSeenAt: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
        isStale,
      };
    });

    const avgCpuLoad = cpuCount > 0 ? Math.round(totalCpu / cpuCount) : 0;

    return {
      totalRouters: routers.length,
      onlineCount,
      offlineCount,
      avgCpuLoad,
      totalSessions,
      routers: routerList,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Audit Log Browsing with pagination and actor search
   */
  async getAuditLogs(
    tenantId: string,
    query: AuditLogQueryDto = {}
  ): Promise<AuditLogListResultDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
    };

    if (query.action) {
      where.action = query.action as any;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { entityId: { contains: query.search } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              memberships: {
                where: { tenantId },
                select: { role: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    const items = logs.map((l) => ({
      id: l.id,
      action: l.action as unknown as AuditAction,
      entityType: l.entityType,
      entityId: l.entityId,
      details: (l.details as Record<string, unknown>) || null,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt.toISOString(),
      user: l.user
        ? {
            id: l.user.id,
            fullName: l.user.fullName,
            email: l.user.email,
            role: l.user.memberships?.[0]?.role as string || 'USER',
          }
        : null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
