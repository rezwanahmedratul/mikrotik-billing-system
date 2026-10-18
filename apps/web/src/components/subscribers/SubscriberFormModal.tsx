'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, KeyRound, Shield, Router as RouterIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { CreateSubscriberFormData } from './subscribers.types';

interface PackageOption {
  id: string;
  name: string;
  priceFormatted: string;
  speedLimitRaw: string;
}

interface RouterOption {
  id: string;
  name: string;
  host: string;
}

interface SubscriberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateSubscriberFormData) => Promise<string | void>;
  packages: PackageOption[];
  routers: RouterOption[];
}

export function SubscriberFormModal({
  isOpen,
  onClose,
  onSubmit,
  packages,
  routers,
}: SubscriberFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nidOrPassport, setNidOrPassport] = useState('');
  const [address, setAddress] = useState('');
  const [packageId, setPackageId] = useState('');
  const [routerId, setRouterId] = useState('');
  const [pppoeUsername, setPppoeUsername] = useState('');
  const [pppoePassword, setPppoePassword] = useState('');
  const [staticIp, setStaticIp] = useState('');
  const [callerId, setCallerId] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setPhone('');
      setEmail('');
      setNidOrPassport('');
      setAddress('');
      setPackageId(packages[0]?.id || '');
      setRouterId(routers[0]?.id || '');
      setPppoeUsername('');
      // Generate initial random password
      setPppoePassword(Math.random().toString(36).slice(-8) + Math.floor(100 + Math.random() * 900));
      setStaticIp('');
      setCallerId('');
      setModalError('');
    }
  }, [isOpen, packages, routers]);

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!pppoeUsername || pppoeUsername.startsWith('user_')) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setPppoeUsername(clean ? `${clean}_${Math.floor(100 + Math.random() * 900)}` : '');
    }
  };

  const handleGeneratePassword = () => {
    setPppoePassword(Math.random().toString(36).slice(-8) + Math.floor(100 + Math.random() * 900));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setModalError('Subscriber full name is required.');
      return;
    }
    if (!phone.trim()) {
      setModalError('Contact phone number is required.');
      return;
    }
    if (!packageId) {
      setModalError('Please select an Internet Package.');
      return;
    }
    if (!routerId) {
      setModalError('Please select a Router Gateway.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    const payload: CreateSubscriberFormData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      nidOrPassport: nidOrPassport.trim() || undefined,
      address: address.trim() || undefined,
      packageId,
      routerId,
      pppoeUsername: pppoeUsername.trim() || undefined,
      pppoePassword: pppoePassword.trim() || undefined,
      staticIp: staticIp.trim() || undefined,
      callerId: callerId.trim() || undefined,
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
      title="Register New Subscriber"
      description="Create client profile and automatically provision PPPoE credentials."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {modalError && (
          <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white flex items-center gap-2 dark:bg-white dark:text-black dark:border-white">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Contact Info */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800 pb-0.5">
          Subscriber Details
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Zahirul Islam"
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Mobile Phone *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01712345678"
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              NID / Passport
            </label>
            <input
              type="text"
              value={nidOrPassport}
              onChange={(e) => setNidOrPassport(e.target.value)}
              placeholder="e.g. 199026925..."
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
            Service Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. House 42, Road 11, Block D, Banani"
            className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
          />
        </div>

        {/* Plan & Network Gateway */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 pt-1 border-b border-neutral-100 dark:border-neutral-800 pb-0.5">
          Service Package & Gateway
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Internet Package *
            </label>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              required
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.speedLimitRaw}) - {pkg.priceFormatted}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Router Gateway *
            </label>
            <select
              value={routerId}
              onChange={(e) => setRouterId(e.target.value)}
              required
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            >
              {routers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.host})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PPPoE Credentials */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 pt-1 border-b border-neutral-100 dark:border-neutral-800 pb-0.5">
          PPPoE Secret Credentials
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              PPPoE Username
            </label>
            <input
              type="text"
              value={pppoeUsername}
              onChange={(e) => setPppoeUsername(e.target.value)}
              placeholder="e.g. zahir_101"
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                PPPoE Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white inline-flex items-center gap-1 transition"
              >
                <KeyRound className="w-2.5 h-2.5" />
                <span>New</span>
              </button>
            </div>
            <input
              type="text"
              value={pppoePassword}
              onChange={(e) => setPppoePassword(e.target.value)}
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Static IP (Optional)
            </label>
            <input
              type="text"
              value={staticIp}
              onChange={(e) => setStaticIp(e.target.value)}
              placeholder="e.g. 10.10.20.55"
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
              Caller ID / MAC (Optional)
            </label>
            <input
              type="text"
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
              placeholder="e.g. 00:1A:2B:3C:4D:5E"
              className="w-full h-8 px-2.5 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            Encrypted with AES-256-GCM
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Register & Provision</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
