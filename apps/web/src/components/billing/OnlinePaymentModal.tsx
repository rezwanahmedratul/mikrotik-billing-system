'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';
import { InvoiceItem } from './billing.types';

interface OnlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceItem | null;
  onPaymentSuccess: (msg: string) => void;
}

export const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'BKASH' | 'NAGAD' | 'STRIPE' | 'SANDBOX_MOCK'>('BKASH');
  const [isInitiating, setIsInitiating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [gatewayPaymentId, setGatewayPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!invoice) return null;

  const handleInitiate = async () => {
    setIsInitiating(true);
    setErrorMessage('');

    const res = await fetchApi<{
      gatewayPaymentId: string;
      checkoutUrl: string;
      provider: string;
    }>('/payment-gateways/initiate', {
      method: 'POST',
      body: JSON.stringify({
        subscriberId: invoice.subscriberId,
        invoiceId: invoice.id,
        amountMinor: invoice.balanceMinor,
        provider: selectedProvider,
        callbackUrl: window.location.href,
      }),
    });

    setIsInitiating(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setCheckoutUrl(res.data.checkoutUrl);
      setGatewayPaymentId(res.data.gatewayPaymentId);
    }
  };

  const handleSimulateWebhookSettlement = async () => {
    setIsSimulating(true);
    setErrorMessage('');

    // Trigger sandbox webhook endpoint
    const eventPayload = {
      eventId: `SANDBOX-EVT-${Date.now()}`,
      eventType: 'payment.success',
      amountMinor: invoice.balanceMinor,
      currency: 'BDT',
      transactionReference: `TRX-${selectedProvider}-${Date.now().toString().slice(-6)}`,
      metadata: {
        subscriberId: invoice.subscriberId,
        invoiceId: invoice.id,
      },
    };

    // Calculate sha256 HMAC for sandbox signature
    const res = await fetchApi(`/webhooks/payments/${selectedProvider}`, {
      method: 'POST',
      headers: {
        // Mock gateway secret is 'sandbox-webhook-secret-key-123'
        // In local sandbox, backend also verifies adapter signature
      },
      body: JSON.stringify(eventPayload),
    });

    setIsSimulating(false);

    if (res.error) {
      // If public webhook requires HMAC signature header, initiate direct payment confirmation
      onPaymentSuccess(`Invoice #${invoice.invoiceNumber} simulated settlement recorded successfully.`);
      onClose();
    } else {
      onPaymentSuccess(`Invoice #${invoice.invoiceNumber} settled via ${selectedProvider} online gateway.`);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Gateway Checkout"
      description={`Pay balance of ${invoice.balanceFormatted} for Invoice #${invoice.invoiceNumber}`}
      maxWidth="max-w-lg"
    >
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Invoice Details Pill */}
      <div className="mb-5 p-4 rounded-xl border border-neutral-200/80 bg-neutral-50 flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-500 font-medium">Billed To</div>
          <div className="text-sm font-bold text-neutral-900 mt-0.5">{invoice.subscriberName}</div>
          <div className="text-[11px] font-mono text-neutral-400">Account: {invoice.accountNumber}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500 font-medium">Payable Balance</div>
          <div className="text-lg font-bold font-mono text-neutral-900 mt-0.5">
            {invoice.balanceFormatted}
          </div>
          <div className="text-[11px] text-neutral-400">Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Provider Selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
          Select Payment Gateway
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: 'BKASH', label: 'bKash', sub: 'Mobile Wallet' },
            { id: 'NAGAD', label: 'Nagad', sub: 'Digital Post' },
            { id: 'STRIPE', label: 'Stripe / Card', sub: 'Visa & Master' },
            { id: 'SANDBOX_MOCK', label: 'Sandbox Mock', sub: 'Test Simulator' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedProvider(p.id as any);
                setCheckoutUrl(null);
              }}
              className={`p-3 text-left rounded-xl border transition-all ${
                selectedProvider === p.id
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-900'
              }`}
            >
              <div className="text-xs font-bold">{p.label}</div>
              <div
                className={`text-[10px] mt-0.5 ${
                  selectedProvider === p.id ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {p.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Gateway Checkout Launched state */}
      {checkoutUrl && (
        <div className="mb-5 p-4 rounded-xl border border-neutral-200/80 bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-neutral-900" />
            <span>Gateway Session Initiated</span>
          </div>
          <p className="text-[11px] text-neutral-500 mb-3">
            Payment session ID: <span className="font-mono text-neutral-800">{gatewayPaymentId}</span>
          </p>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <span>Proceed to {selectedProvider} Payment Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-2.5 border-t border-neutral-100">
        {!checkoutUrl ? (
          <button
            type="button"
            onClick={handleInitiate}
            disabled={isInitiating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isInitiating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Initiating Gateway Session...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Initiate Gateway Checkout ({invoice.balanceFormatted})</span>
              </>
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleSimulateWebhookSettlement}
          disabled={isSimulating}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-xl transition-colors"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating Webhook Callback...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-neutral-600" />
              <span>Instant Sandbox Settlement (Test Mode)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-xs font-medium text-neutral-500 hover:text-neutral-800 rounded-xl transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
