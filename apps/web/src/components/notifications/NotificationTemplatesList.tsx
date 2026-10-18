'use client';

import React from 'react';
import { Settings2, Bell, BellOff } from 'lucide-react';
import { NotificationTemplateItem } from './notifications.types';

interface NotificationTemplatesListProps {
  templates: NotificationTemplateItem[];
  onEdit: (template: NotificationTemplateItem) => void;
}

export const NotificationTemplatesList: React.FC<NotificationTemplatesListProps> = ({
  templates,
  onEdit,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-neutral-100 text-neutral-800">
                {tpl.type}
              </span>
              {tpl.isEnabled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400">
                  <BellOff className="w-3.5 h-3.5" />
                  <span>Disabled</span>
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-neutral-900 mb-2">{tpl.name}</h3>

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 text-xs font-mono text-neutral-700 leading-relaxed line-clamp-3 mb-4">
              {tpl.templateText}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">
              Updated {new Date(tpl.updatedAt).toLocaleDateString()}
            </span>
            <button
              onClick={() => onEdit(tpl)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-xl transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
