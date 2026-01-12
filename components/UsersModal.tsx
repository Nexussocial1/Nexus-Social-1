import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { useFollow } from '../hooks/useFollow';
import { CURRENT_USER } from '../constants';
import FollowButton from './FollowButton';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
}

const UsersModal: React.FC<UsersModalProps> = ({ isOpen, onClose, title, users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isFollowing, follow, unfollow } = useFollow(CURRENT_USER.id);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFollowToggle = (userId: string) => {
    if (isFollowing(userId)) {
      unfollow(userId);
    } else {
      follow(userId);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
      <div 
        className="glass-aura w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[80vh] refract-border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-display font-black text-white tracking-tighter uppercase">{title}</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">{users.length} Entities Synchronized</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 border-b border-white/5">
          <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border border-white/5 flex items-center gap-4 bg-white/5 focus-within:bg-white/10 transition-all">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Query the node..."
              className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 glass-aura rounded-[1.8rem] border border-transparent hover:border-white/10 hover:bg-white/5 transition-all group">
                <Link 
                  to={`/profile/${user.username}`} 
                  onClick={onClose}
                  className="flex items-center gap-5 overflow-hidden flex-1"
                >
                  <img 
                    src={user.avatar} 
                    className="w-12 h-12 rounded-2xl object-cover bg-slate-900 ring-2 ring-white/5 group-hover:scale-105 transition-transform" 
                    alt={user.displayName} 
                  />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors text-sm">{user.displayName}</h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">@{user.username}</p>
                  </div>
                </Link>
                
                {user.id !== CURRENT_USER.id && (
                  <FollowButton 
                    isFollowing={isFollowing(user.id)} 
                    onClick={() => handleFollowToggle(user.id)}
                    size="sm"
                    className="group"
                  />
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">No matches detected in this sector.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersModal;
