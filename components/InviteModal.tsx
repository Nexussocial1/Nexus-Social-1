import React, { useState } from 'react';
import { User } from '../types';

interface InviteModalProps {
  targetName: string;
  targetType: 'user' | 'group' | 'page';
  friends: User[];
  isOpen: boolean;
  onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ targetName, targetType, friends, isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filteredFriends = friends.filter(f => 
    f.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = (friendId: string) => {
    setInvitedIds(prev => new Set(prev).add(friendId));
    // Simulation: In a real app, this would send a notification to friendId with a join/follow request
  };

  const getTargetLabel = () => {
    switch(targetType) {
      case 'group': return 'Cluster';
      case 'page': return 'Portal';
      default: return 'Profile';
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
      <div 
        className="glass-aura w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[80vh] refract-border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-2xl font-display font-black text-white tracking-tighter uppercase">Propagate {getTargetLabel()}</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">Invite friends to synchronize with {targetName}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 border-b border-white/5 bg-black/20">
          <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border border-white/5 flex items-center gap-4 focus-within:bg-white/10 transition-all">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Query your frequency..."
              className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-4 glass-aura rounded-[1.8rem] border border-white/5 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-5 overflow-hidden flex-1">
                  <img src={friend.avatar} className="w-12 h-12 rounded-2xl object-cover bg-slate-900 ring-1 ring-white/10" alt="" />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white truncate text-sm">{friend.displayName}</h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">@{friend.username}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleInvite(friend.id)}
                  disabled={invitedIds.has(friend.id)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    invitedIds.has(friend.id)
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default flex items-center gap-2'
                      : 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg shadow-white/5'
                  }`}
                >
                  {invitedIds.has(friend.id) ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Transmitted
                    </>
                  ) : 'Beam'}
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">No available nodes for invitation.</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.01] text-center">
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
             Beam will propagate through their Neural Echoes buffer.
           </p>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
