'use client';

import React, { useState } from 'react';
import { Building2, Mail, Phone, MapPin, DollarSign, Save, Check } from 'lucide-react';
import { TenantSettingsData } from './settings.types';

interface GeneralSettingsFormProps {
  settings: TenantSettingsData;
  onSave: (updated: Partial<TenantSettingsData>) => Promise<void>;
  isLoading?: boolean;
}

export function GeneralSettingsForm({
  settings,
  onSave,
  isLoading = false,
}: GeneralSettingsFormProps) {
  const [name, setName] = useState(settings.name);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [address, setAddress] = useState(settings.address);
  const [currency, setCurrency] = useState(settings.currency);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      supportEmail,
      supportPhone,
      address,
      currency,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="mb-5 border-b border-neutral-100 pb-4">
        <h2 className="text-sm font-semibold text-neutral-900">Organization Profile</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Legal business entity details presented on customer invoices and SMS notifications
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700">Company Name</label>
            <div className="relative mt-1.5">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/50 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="FastNet Broadband Ltd"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700">Support Email</label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/50 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="support@fastnet.com"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700">Helpdesk Phone Hotline</label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/50 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="01700000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700">Billing Currency</label>
            <div className="relative mt-1.5">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/50 py-2 pl-9 pr-3 text-xs text-neutral-900 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
                <option value="USD">USD ($ - US Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">Registered Office Address</label>
          <div className="relative mt-1.5">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/50 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="Level 4, House 12, Road 4, Dhanmondi, Dhaka-1205"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Profile Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
