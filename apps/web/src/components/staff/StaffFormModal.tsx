import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader2, AlertCircle, Shield, Radio, CreditCard, Eye, EyeOff } from 'lucide-react';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    password?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  modalError: string;
}

export function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  modalError,
}: StaffFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('ISP_OPERATOR');
  const [password, setPassword] = useState('TempPass123!');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      fullName,
      email,
      phone: phone || undefined,
      role,
      password,
    });
  };

  const roles = [
    {
      id: 'ISP_ADMIN',
      title: 'Administrator',
      desc: 'Full control over routers, billing, staff, and settings.',
      icon: Shield,
    },
    {
      id: 'ISP_OPERATOR',
      title: 'Network Operator',
      desc: 'Provision subscribers, manage routers, view traffic.',
      icon: Radio,
    },
    {
      id: 'CASHIER',
      title: 'Cashier / Collector',
      desc: 'Record manual cash/mobile payments, print receipts.',
      icon: CreditCard,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Organization Staff Member"
      description="Invite a team member with role-based access control scoped strictly to your tenant."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {modalError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{modalError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700">Full Name *</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Mahbub Alam"
            className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mahbub@isp.com"
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+8801700000000"
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700">Initial Password *</label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-10 text-xs text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Assign Role *</label>
          <div className="space-y-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-neutral-50/50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-200/70 text-neutral-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs">{r.title}</div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {r.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            Cancel
          </button>
          <button
            id="create-staff-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Add Member</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
