'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { NotificationTemplateItem } from './notifications.types';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: NotificationTemplateItem | null;
  onSave: (type: string, data: { templateText: string; isEnabled: boolean }) => Promise<void>;
}

const AVAILABLE_VARIABLES = [
  { tag: '{{name}}', desc: 'Subscriber Full Name' },
  { tag: '{{invoiceNumber}}', desc: 'Invoice Number (INV-xxxxx)' },
  { tag: '{{amount}}', desc: 'Billing Amount (e.g. 1500.00)' },
  { tag: '{{dueDate}}', desc: 'Invoice Due Date' },
  { tag: '{{suspensionDate}}', desc: 'Scheduled Cutoff Date' },
  { tag: '{{transactionReference}}', desc: 'Payment Reference / TrxID' },
  { tag: '{{balance}}', desc: 'Current Account Balance' },
];

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
}) => {
  const [templateText, setTemplateText] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (template) {
      setTemplateText(template.templateText);
      setIsEnabled(template.isEnabled);
      setErrorMessage('');
    }
  }, [template, isOpen]);

  if (!template) return null;

  const handleInsertTag = (tag: string) => {
    setTemplateText((prev) => prev + ' ' + tag);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateText.trim()) {
      setErrorMessage('Template text cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      await onSave(template.type, {
        templateText: templateText.trim(),
        isEnabled,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Sample live preview generator
  const previewText = templateText
    .replace(/\{\{\s*name\s*\}\}/g, 'Tareq Rahman')
    .replace(/\{\{\s*subscriberName\s*\}\}/g, 'Tareq Rahman')
    .replace(/\{\{\s*invoiceNumber\s*\}\}/g, 'INV-00104')
    .replace(/\{\{\s*amount\s*\}\}/g, '1,500.00')
    .replace(/\{\{\s*dueDate\s*\}\}/g, 'Nov 10, 2026')
    .replace(/\{\{\s*suspensionDate\s*\}\}/g, 'Nov 15, 2026')
    .replace(/\{\{\s*transactionReference\s*\}\}/g, 'TRX-BKASH-998822')
    .replace(/\{\{\s*paymentNumber\s*\}\}/g, 'PAY-00042')
    .replace(/\{\{\s*balance\s*\}\}/g, '0.00');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure Template: ${template.name}`}
      description="Update SMS template phrasing, dynamic variables, and automated trigger status."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 dark:bg-neutral-900 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
          <div>
            <div className="text-xs font-semibold text-neutral-900 dark:text-white">Enable Automated Trigger</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Send SMS automatically when this business event occurs
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              isEnabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isEnabled ? 'translate-x-5 bg-white dark:bg-black' : 'translate-x-0 bg-white dark:bg-neutral-400'
              }`}
            />
          </button>
        </div>

        {/* Insert Dynamic Variables */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
            Dynamic Variables (Click to Insert)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_VARIABLES.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInsertTag(v.tag)}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-mono rounded-lg transition-colors border border-neutral-200/60 dark:border-neutral-700 flex items-center gap-1 interactive-btn"
                title={v.desc}
              >
                <span>{v.tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Template Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Template Message Body
            </label>
            <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
              {templateText.length} chars (~{Math.ceil(templateText.length / 160) || 1} SMS)
            </span>
          </div>
          <textarea
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            rows={4}
            className="w-full p-3 bg-neutral-50/70 border border-neutral-200 dark:border-neutral-800 dark:bg-black rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
            placeholder="Write template message with {{tags}}..."
          />
        </div>

        {/* Live Preview Box */}
        <div className="p-3.5 bg-neutral-100/70 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
            <span>Sample Client SMS Preview:</span>
          </div>
          <div className="text-xs text-neutral-800 dark:text-neutral-200 font-sans leading-relaxed bg-white dark:bg-black p-3 rounded-lg border border-neutral-200/60 dark:border-neutral-800 shadow-xs">
            {previewText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 interactive-btn"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Template</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
