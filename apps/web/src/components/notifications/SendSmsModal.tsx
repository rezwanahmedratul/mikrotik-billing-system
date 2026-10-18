'use client';

import React, { useState } from 'react';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';

interface SendSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const SendSmsModal: React.FC<SendSmsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('Recipient phone number is required.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Message text cannot be empty.');
      return;
    }

    setIsSending(true);
    setErrorMessage('');

    const res = await fetchApi('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientPhone: phone.trim(),
        message: message.trim(),
      }),
    });

    setIsSending(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onSuccess(`Direct SMS dispatched to ${phone}.`);
      setPhone('');
      setMessage('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Direct SMS"
      description="Send a manual SMS announcement or notice to any client mobile number."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
            Recipient Mobile Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 01715000001"
            className="w-full px-3.5 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm font-mono text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
          <div className="text-[11px] text-neutral-400 mt-1">
            Standard Bangladeshi 11-digit mobile format
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Message Text
            </label>
            <span className="text-[11px] font-mono text-neutral-400">
              {message.length} chars (~{Math.ceil(message.length / 160) || 1} SMS)
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Type your SMS message..."
            className="w-full p-3 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-xl hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending SMS...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch SMS</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
