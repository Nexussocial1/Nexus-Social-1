
import React, { useState } from 'react';
import { User, Post } from '../types';

interface ReportModalProps {
  user: User;
  post?: Post;
  isOpen: boolean;
  onClose: () => void;
  onReportSuccess: (id: string, isUser: boolean) => void;
}

const REPORT_REASONS = [
  { label: 'Spam / Misleading', icon: '🚨' },
  { label: 'Harassment', icon: '👤' },
  { label: 'Hate Speech', icon: '🗣️' },
  { label: 'Inappropriate Content', icon: '🔞' },
  { label: 'Violence', icon: '⚔️' }
];

const ReportModal: React.FC<ReportModalProps> = ({ user, post, isOpen, onClose, onReportSuccess }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleQuickReport = (reason: string) => {
    setSelectedReason(reason);
    setIsSubmitting(true);
    
    // Neural suppression simulation
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(true);
      
      setTimeout(() => {
        onReportSuccess(post ? post.id : user.id, !post);
        onClose();
        setShowConfirmation(false);
        setSelectedReason(null);
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="glass-aura w-full max-w-md rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative animate-in zoom-in-95">
        
        {showConfirmation ? (
          <div className="p-12 text-center space-y-6 animate-in fade-in zoom-in-90">
            <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">Node Suppressed</h3>
            <p className="text-slate-400 text-xs font-medium tracking-wide leading-relaxed">
              Frequency anomaly corrected. This emission has been purged from your local hub.
            </p>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-black text-white tracking-tight uppercase">Neural Flag</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-rose-500 mt-1">Calibrating Feed Safety</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <img src={user.avatar} className="w-10 h-10 rounded-xl bg-slate-900 ring-1 ring-white/10" alt="" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white block truncate">{user.displayName}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">@{user.username}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 mb-4">Select Violation Frequency</p>
                <div className="grid grid-cols-1 gap-2">
                  {REPORT_REASONS.map(reason => (
                    <button
                      key={reason.label}
                      onClick={() => handleQuickReport(reason.label)}
                      disabled={isSubmitting}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all text-left disabled:opacity-50"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{reason.icon}</span>
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-white">{reason.label}</span>
                      </div>
                      <svg className="w-4 h-4 text-slate-700 group-hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleQuickReport('Other')}
                className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-slate-300 transition-colors"
              >
                Other Anomaly
              </button>
            </div>
            
            {isSubmitting && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-white/10 border-t-rose-500 rounded-full animate-spin"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500">Neutralizing...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
