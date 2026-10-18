'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PackageItem, PackageFormData } from './packages.types';

interface PackageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: PackageFormData) => Promise<string | void>; // returns error string if any
  editingPackage: PackageItem | null;
}

export function PackageFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingPackage,
}: PackageFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [speedLimitRaw, setSpeedLimitRaw] = useState('');
  const [priceMajor, setPriceMajor] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [validityDays, setValidityDays] = useState(30);
  const [pppProfileName, setPppProfileName] = useState('');
  const [description, setDescription] = useState('');
  const [propagateToActive, setPropagateToActive] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Speed parsed preview
  const [parsedUpload, setParsedUpload] = useState<string | null>(null);
  const [parsedDownload, setParsedDownload] = useState<string | null>(null);

  useEffect(() => {
    if (editingPackage) {
      setName(editingPackage.name);
      setCode(editingPackage.code);
      setSpeedLimitRaw(editingPackage.speedLimitRaw);
      setPriceMajor((editingPackage.priceMinor / 100).toFixed(2));
      setBillingCycle(editingPackage.billingCycle);
      setValidityDays(editingPackage.validityDays);
      setPppProfileName(editingPackage.pppProfileName);
      setDescription(editingPackage.description || '');
      setPropagateToActive(false);
    } else {
      setName('');
      setCode('');
      setSpeedLimitRaw('10M/10M');
      setPriceMajor('1000');
      setBillingCycle('MONTHLY');
      setValidityDays(30);
      setPppProfileName('');
      setDescription('');
      setPropagateToActive(false);
    }
    setModalError('');
  }, [editingPackage, isOpen]);

  useEffect(() => {
    if (!speedLimitRaw) {
      setParsedUpload(null);
      setParsedDownload(null);
      return;
    }
    const regex = /^(\d+)([kKmMgG])?\/(\d+)([kKmMgG])?$/;
    const match = speedLimitRaw.trim().match(regex);
    if (match) {
      const parsePart = (val: string, unit?: string) => {
        const num = parseInt(val, 10);
        const u = (unit || 'k').toUpperCase();
        if (u === 'G') return `${num * 1024} Mbps (${num} Gbps)`;
        if (u === 'M') return `${num} Mbps`;
        return `${num} Kbps`;
      };
      setParsedUpload(parsePart(match[1], match[2]));
      setParsedDownload(parsePart(match[3], match[4]));
    } else {
      setParsedUpload(null);
      setParsedDownload(null);
    }
  }, [speedLimitRaw]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Package name is required.');
      return;
    }
    if (!speedLimitRaw.trim()) {
      setModalError('Speed limit format is required (e.g. 10M/10M).');
      return;
    }
    const priceNum = parseFloat(priceMajor);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError('Please enter a valid non-negative price amount.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    const payload: PackageFormData = {
      name: name.trim(),
      code: code.trim() || undefined,
      speedLimitRaw: speedLimitRaw.trim(),
      priceMinor: Math.round(priceNum * 100),
      billingCycle,
      validityDays: Number(validityDays) || 30,
      pppProfileName: pppProfileName.trim() || name.trim(),
      description: description.trim() || undefined,
      propagateToActiveSubscriptions: editingPackage ? propagateToActive : undefined,
    };

    const err = await onSubmit(payload);
    setIsSubmitting(false);
    if (err) {
      setModalError(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPackage ? `Edit Package: ${editingPackage.name}` : 'Create Internet Package'}
      description="Configure speed limits, MikroTik PPPoE rate-limits, and billing rates."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {modalError && (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingPackage && !code) {
                  setCode(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '')
                  );
                }
              }}
              placeholder="e.g. Fiber Premium 20M"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Package Code
            </label>
            <input
              type="text"
              disabled={!!editingPackage}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. fiber-20m"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-60"
            />
            <span className="text-[11px] text-neutral-400">
              Unique identifier used in billing codes and integrations.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Bandwidth Limit (Upload / Download) *
            </label>
            <input
              type="text"
              required
              value={speedLimitRaw}
              onChange={(e) => setSpeedLimitRaw(e.target.value)}
              placeholder="e.g. 10M/10M or 5120k/10240k"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            {parsedUpload && parsedDownload ? (
              <div className="mt-1 flex items-center gap-2 text-xs font-mono text-neutral-900 dark:text-white font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                <span>
                  Upload: {parsedUpload} | Download: {parsedDownload}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-neutral-400">
                Standard format: <code>Upload/Download</code> (e.g. <code>20M/20M</code>)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              RouterOS Profile Name
            </label>
            <input
              type="text"
              value={pppProfileName}
              onChange={(e) => setPppProfileName(e.target.value)}
              placeholder={name || 'profile-name'}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <span className="text-[11px] text-neutral-400">
              MikroTik PPP profile to assign during PPPoE secret creation.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Price (BDT) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                ৳
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={priceMajor}
                onChange={(e) => setPriceMajor(e.target.value)}
                placeholder="1000.00"
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Billing Cycle
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="SEMI_ANNUALLY">Semi-Annually</option>
              <option value="ANNUALLY">Annually</option>
              <option value="DAILY">Daily</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Validity (Days)
            </label>
            <input
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes or plan details shown to subscribers..."
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        {editingPackage && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="propagate"
                checked={propagateToActive}
                onChange={(e) => setPropagateToActive(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 h-4 w-4"
              />
              <label htmlFor="propagate" className="text-xs font-medium text-neutral-800">
                Propagate changes to existing active subscribers immediately
              </label>
            </div>
            <p className="text-[11px] text-neutral-500 pl-6">
              If left unchecked, existing active subscribers keep their current contracted price
              and bandwidth until their next renewal billing cycle.
            </p>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {editingPackage ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
