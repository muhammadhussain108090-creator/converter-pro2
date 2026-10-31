import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { NoticeMessage } from '../types';

interface ToastProps {
  notice: NoticeMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notice, onDismiss }) => {
  if (!notice) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
          notice.type === 'success'
            ? 'bg-zinc-900/95 text-white border-zinc-700/80 dark:bg-zinc-900 dark:border-emerald-600/40'
            : notice.type === 'error'
            ? 'bg-rose-950/95 text-white border-rose-800/80'
            : notice.type === 'warning'
            ? 'bg-amber-950/95 text-white border-amber-800/80'
            : 'bg-zinc-900/95 text-white border-zinc-700/80'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {notice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {notice.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {notice.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
          {notice.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
        </div>

        <div className="flex-1 text-xs sm:text-sm leading-relaxed font-medium">
          {notice.message}
        </div>

        <button
          onClick={onDismiss}
          className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
