import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { TestResult } from './routers.types';

interface RouterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    host: string;
    port: number;
    protocol: string;
    username: string;
    password: string;
  }) => Promise<void>;
  onTestConnection: (data: {
    host: string;
    port: number;
    protocol: string;
    username: string;
    password: string;
  }) => Promise<TestResult | null>;
  isSaving: boolean;
  modalError: string;
}

export function RouterFormModal({
  isOpen,
  onClose,
  onSubmit,
  onTestConnection,
  isSaving,
  modalError,
}: RouterFormModalProps) {
  const [routerName, setRouterName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('443');
  const [protocol, setProtocol] = useState('REST_HTTPS');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleProtocolChange = (newProtocol: string) => {
    setProtocol(newProtocol);
    if (newProtocol === 'REST_HTTPS') setPort('443');
    else if (newProtocol === 'REST_HTTP') setPort('80');
    else if (newProtocol === 'API_SSL') setPort('8729');
    else if (newProtocol === 'API_PLAINTEXT') setPort('8728');
  };

  const handleTest = async () => {
    if (!host || !username || !password) return;
    setIsTesting(true);
    setTestResult(null);
    const result = await onTestConnection({
      host,
      port: Number(port),
      protocol,
      username,
      password,
    });
    setIsTesting(false);
    if (result) setTestResult(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: routerName,
      host,
      port: Number(port),
      protocol,
      username,
      password,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register MikroTik Router Gateway"
      description="Connect a physical or virtual RouterOS device. Secrets are encrypted at rest with AES-256-GCM."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {modalError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{modalError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700">Gateway Label / Identifier *</label>
          <input
            type="text"
            required
            value={routerName}
            onChange={(e) => setRouterName(e.target.value)}
            placeholder="e.g. Core-CCR2004-Dhanmondi"
            className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700">Host / IP / FQDN *</label>
            <input
              type="text"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. 192.168.88.1 or router.isp.net"
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Port *</label>
            <input
              type="number"
              required
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700">Communication Protocol *</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: 'REST_HTTPS', label: 'REST HTTPS', port: '443' },
              { id: 'REST_HTTP', label: 'REST HTTP', port: '80' },
              { id: 'API_SSL', label: 'API-SSL', port: '8729' },
              { id: 'API_PLAINTEXT', label: 'API Plain', port: '8728' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProtocolChange(p.id)}
                className={`rounded-xl border p-2 text-center text-xs transition ${
                  protocol === p.id
                    ? 'border-neutral-900 bg-neutral-900 font-semibold text-white'
                    : 'border-neutral-200 bg-neutral-50/50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <div>{p.label}</div>
                <div className="text-[10px] opacity-75 font-mono">Port {p.port}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">API Username *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. api_billing"
              className="mt-1.5 block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">API Password *</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 pr-10 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 transition"
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
        </div>

        {testResult && (
          <div
            className={`rounded-xl border p-3 text-xs ${
              testResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <div>
                <span className="font-semibold block">Socket Handshake Verified ({testResult.latencyMs} ms)</span>
                <span>ROS v{testResult.rosVersion} on {testResult.identity || 'MikroTik Gateway'}</span>
              </div>
            ) : (
              <div>
                <span className="font-semibold block">Test Failed</span>
                <span>{testResult.error || 'Connection failed'}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !host || !username || !password}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 disabled:opacity-40 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Probing...' : 'Test Handshake'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
            <button
              id="save-router-submit-btn"
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-50 transition"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Gateway</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
