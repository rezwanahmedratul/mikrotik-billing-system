'use client';

import React from 'react';
import { CreditCard, RotateCcw, Wallet, Download, UserCheck } from 'lucide-react';
import { CollectionsReportData } from './reports.types';

interface CollectionsReportViewProps {
  data: CollectionsReportData | null;
  isLoading: boolean;
  onExportCsv: () => void;
}

export function CollectionsReportView({ data, isLoading, onExportCsv }: CollectionsReportViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500">
        Aggregating financial transactions...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500">
        No collection records available for the selected period.
      </div>
    );
  }

  const grossFormatted = (data.grossCollectedMinor / 100).toFixed(2);
  const reversalsFormatted = (data.reversalsMinor / 100).toFixed(2);
  const netFormatted = (data.netCollectedMinor / 100).toFixed(2);

  const methodEntries = Object.entries(data.byMethod);

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Gross Collections
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">৳ {grossFormatted}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {data.totalTransactionsCount} total payments logged
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Payment Reversals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-rose-600">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">৳ {reversalsFormatted}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">Refunded or reversed amounts</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Net Retained Cash
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">৳ {netFormatted}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Net verified intake</div>
        </div>
      </div>

      {/* Two Column Layout: Payment Methods & Cashier Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Breakdown */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Collections by Gateway / Method</h3>
              <p className="text-xs text-neutral-500">Breakdown of gross collections across channels</p>
            </div>
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="space-y-3">
            {methodEntries.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">No method breakdown data</div>
            ) : (
              methodEntries.map(([method, info]) => {
                const totalGross = data.grossCollectedMinor || 1;
                const percentage = Math.round((info.totalMinor / totalGross) * 100);

                return (
                  <div key={method} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-800">{method}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">{info.count} txns</span>
                        <span className="font-mono font-semibold text-neutral-900">
                          ৳ {(info.totalMinor / 100).toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cashier / Collector Breakdown */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Collector / Cashier Performance</h3>
            <p className="text-xs text-neutral-500">Volume and counts by staff operator</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-3 py-2.5">Collector</th>
                  <th className="px-3 py-2.5">Transactions</th>
                  <th className="px-3 py-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.byCashier.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-neutral-500">
                      No staff collection records
                    </td>
                  </tr>
                ) : (
                  data.byCashier.map((cashier) => (
                    <tr key={cashier.cashierId} className="transition-colors hover:bg-neutral-50/60">
                      <td className="px-3 py-2.5 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{cashier.cashierName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-neutral-600">{cashier.count}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-neutral-900">
                        ৳ {(cashier.totalMinor / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Trend Table */}
      {data.dailyTrend.length > 0 && (
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">Daily Inflow Trend</h3>
          <p className="text-xs text-neutral-500 mb-4">Historical progression of daily intake and reversals</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Txn Count</th>
                  <th className="px-4 py-2.5 text-right">Gross Collections</th>
                  <th className="px-4 py-2.5 text-right">Reversals</th>
                  <th className="px-4 py-2.5 text-right">Net Collections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.dailyTrend.map((d) => (
                  <tr key={d.date} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-2.5 font-mono font-medium text-neutral-900">{d.date}</td>
                    <td className="px-4 py-2.5 font-mono text-neutral-600">{d.count}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-neutral-900">
                      ৳ {(d.grossMinor / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-rose-600">
                      ৳ {(d.reversalsMinor / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-600">
                      ৳ {(d.netMinor / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
