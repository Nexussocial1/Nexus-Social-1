import React from 'react';
import { Notification } from '../types';

interface NotificationActionModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onMute: () => void;
}

const NotificationActionModal: React.FC<NotificationActionModalProps> = ({ 
  notification, 
  isOpen, 
  onClose, 
  onDelete, 
  onMute 
}) => {
  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-8"></div>

        {/* Header Information */}
        <div className="text-center mb-8 px-4">
          <div className="relative inline-block mb-4">
            <img 
              src={notification.actorAvatar} 
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-lg" 
              alt={notification.actorName} 
            />
          </div>
          <p className="text-slate-900 text-lg font-medium leading-tight">
            <span className="font-bold">{notification.actorName}</span> {notification.message}
          </p>
        </div>

        <div className="h-[1px] bg-slate-100 w-full mb-4"></div>

        {/* Action List */}
        <div className="space-y-2">
          <button 
            onClick={() => { onDelete(notification.id); onClose(); }}
            className="w-full flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-base">Delete this notification</span>
          </button>

          <button 
            onClick={() => { onMute(); onClose(); }}
            className="w-full flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-base">Turn off these notifications</span>
          </button>

          <button 
            onClick={() => onClose()}
            className="w-full flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-base">Report issue to Notifications Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationActionModal;
