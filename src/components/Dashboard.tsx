import React, { useEffect, useState } from 'react';
import {
  User,
  History,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Edit2,
  Check,
  X
} from 'lucide-react';
import {
  fetchConversionRecords,
  clearConversionRecords,
  requestEmailVerification,
  updateUserName,
  firebaseReady
} from '../config/firebase';
import { ConversionHistoryItem } from '../types';
import { formatBytes } from '../utils/pureLogic';

interface DashboardProps {
  user: any;
  onOpenAuth: () => void;
  onSelectTool: (toolId: string) => void;
  onShowNotice: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onOpenAuth,
  onSelectTool,
  onShowNotice
}) => {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [updatingName, setUpdatingName] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const records = await fetchConversionRecords(user?.uid);
      setHistory(records);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your conversion history?')) {
      await clearConversionRecords(user?.uid);
      setHistory([]);
      onShowNotice('info', 'Conversion history cleared.');
    }
  };

  const handleResendVerification = async () => {
    try {
      await requestEmailVerification();
      setVerificationSent(true);
      onShowNotice('success', 'Verification email sent. Please check your inbox.');
    } catch (err: any) {
      onShowNotice('error', err?.message || 'Failed to send verification email.');
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setUpdatingName(true);
    try {
      await updateUserName(newName.trim());
      setIsEditingName(false);
      onShowNotice('success', 'Profile name updated.');
    } catch (err: any) {
      onShowNotice('error', err?.message || 'Could not update profile name.');
    } finally {
      setUpdatingName(false);
    }
  };

  const exportHistoryJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `convertpro-history-${Date.now()}.json`;
    a.click();
  };

  // Stats
  const totalConversions = history.length;
  const successfulConversions = history.filter(h => h.status === 'success').length;
  const totalBytesProcessed = history.reduce((acc, curr) => acc + (curr.inputFileSize || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-900 dark:text-white">
            User Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your account settings, privacy preferences, and conversion activity.
          </p>
        </div>

        {!user && (
          <button
            onClick={onOpenAuth}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Sign in to sync across devices</span>
          </button>
        )}
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-950/40">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'
              )}
            </div>

            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={updatingName}
                    className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                    aria-label="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 cursor-pointer"
                    aria-label="Cancel editing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-heading font-extrabold text-zinc-900 dark:text-white">
                    {user?.displayName || (user ? 'Registered User' : 'Guest User')}
                  </h2>
                  {user && (
                    <button
                      onClick={() => {
                        setNewName(user.displayName || '');
                        setIsEditingName(true);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      title="Edit display name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {user?.email || 'Local offline session (conversions stored in browser memory)'}
              </p>

              {user && (
                <div className="flex items-center gap-3 mt-2.5">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3" />
                      Email Verified
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                        <AlertTriangle className="w-3 h-3" />
                        Email Not Verified
                      </span>
                      {!verificationSent ? (
                        <button
                          onClick={handleResendVerification}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold underline hover:no-underline cursor-pointer"
                        >
                          Send verification email
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Link sent!
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 flex items-center gap-3 flex-1 sm:flex-initial">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Data Protection
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Zero raw files stored in database
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40">
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              Total Operations
            </span>
            <p className="text-2xl font-heading font-extrabold text-indigo-950 dark:text-indigo-100 mt-1">
              {totalConversions}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/40">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Successful Conversions
            </span>
            <p className="text-2xl font-heading font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">
              {successfulConversions}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100/80 dark:border-violet-900/40">
            <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">
              Data Processed
            </span>
            <p className="text-2xl font-heading font-extrabold text-violet-950 dark:text-violet-100 mt-1">
              {formatBytes(totalBytesProcessed)}
            </p>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Conversion History</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              History log of tools used, file sizes, and operation outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadHistory}
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {history.length > 0 && (
              <>
                <button
                  onClick={exportHistoryJSON}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* List / Table */}
        {loadingHistory ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span>Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No conversion history yet
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Your recent operations will be logged here with input sizes and results.
            </p>
            <button
              onClick={() => onSelectTool('merge')}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Explore tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-3">Tool</th>
                  <th className="py-3 px-3">Original File</th>
                  <th className="py-3 px-3">Output File</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-zinc-900 dark:text-white">
                      {item.toolName}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium max-w-[160px] truncate" title={item.inputFileName}>
                        {item.inputFileName}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {formatBytes(item.inputFileSize)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-medium max-w-[160px] truncate" title={item.outputFileName}>
                        {item.outputFileName}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {formatBytes(item.outputFileSize)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => onSelectTool(item.toolId)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Launch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
