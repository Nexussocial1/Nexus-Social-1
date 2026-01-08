
import React from 'react';
import { Post, User } from '../types';

interface PostActionModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onUnfollow: (userId: string) => void;
  onMute: (userId: string) => void;
  onBlock: (userId: string) => void;
  onReport: (postId: string) => void;
  isFollowing: boolean;
}

const PostActionModal: React.FC<PostActionModalProps> = ({ 
  post, 
  isOpen, 
  onClose, 
  onUnfollow, 
  onMute, 
  onBlock, 
  onReport,
  isFollowing
}) => {
  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom-full duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

        <div className="space-y-1">
          {isFollowing && (
            <button 
              onClick={() => handleAction(() => onUnfollow(post.userId))}
              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left group"
            >
              <div className="w-6 h-6 flex items-center justify-center text-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
              </div>
              <span className="text-slate-900 font-medium text-lg">Unfollow @{post.authorName.toLowerCase().replace(/\s+/g, '')}</span>
            </button>
          )}

          <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left">
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">Add/remove from Lists</span>
          </button>

          <button 
            onClick={() => handleAction(() => onMute(post.userId))}
            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">Mute @{post.authorName.toLowerCase().replace(/\s+/g, '')}</span>
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left">
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">Mute conversation</span>
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left">
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">View Hidden Replies</span>
          </button>

          <button 
            onClick={() => handleAction(() => onBlock(post.userId))}
            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">Block @{post.authorName.toLowerCase().replace(/\s+/g, '')}</span>
          </button>

          <div className="h-[1px] bg-slate-100 w-full my-2"></div>

          <button 
            onClick={() => handleAction(() => onReport(post.id))}
            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">Report post</span>
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left">
            <div className="w-6 h-6 flex items-center justify-center text-slate-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span className="text-slate-900 font-medium text-lg">Request Community Note</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostActionModal;
