import React, { useState } from 'react';
import { Post, User } from '../types';
import { SUGGESTED_FRIENDS } from '../constants';

interface ShareModalProps {
  post?: Post;
  profile?: User;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess: (message: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ post, profile, isOpen, onClose, onShareSuccess }) => {
  const [activeTab, setActiveTab] = useState<'nexus' | 'external'>('nexus');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!isOpen) return null;

  const getShareUrl = () => {
    if (post) return `${window.location.origin}/#/post/${post.id}`;
    if (profile) return `${window.location.origin}/#/profile/${profile.username}`;
    return window.location.origin;
  };

  const getShareText = () => {
    if (post) return `Check out this transmission on Nexus: "${post.content.slice(0, 50)}..."`;
    if (profile) return `Synchronize with ${profile.displayName} on the Nexus Network.`;
    return "Check out the Nexus Social Network!";
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleShareToFeed = () => {
    setIsSharing(true);
    setTimeout(() => {
      setIsSharing(false);
      onShareSuccess('Transmission resonated to your feed!');
      onClose();
    }, 1000);
  };

  const handleExternalShare = (platform: 'whatsapp' | 'x' | 'native') => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    } else if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({
        title: 'Nexus Social',
        text: getShareText(),
        url: getShareUrl(),
      }).catch(console.error);
    }
    onShareSuccess(`Bridge established via ${platform.toUpperCase()}`);
  };

  const filteredFriends = SUGGESTED_FRIENDS.filter(f =>
    f.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
      <div 
        className="glass-aura w-full max-w-lg rounded-[3.5rem] overflow-hidden animate-in zoom-in-95 duration-500 refract-border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-2xl font-display font-black text-white tracking-tight uppercase">Establish Bridge</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">Propagate this neural node</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex border-b border-white/5 bg-white/5">
          <button
            onClick={() => setActiveTab('nexus')}
            className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'nexus' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Internal Nexus
            {activeTab === 'nexus' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>}
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'external' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            External Bridge
            {activeTab === 'external' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>}
          </button>
        </div>

        <div className="p-10 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'nexus' ? (
            <div className="space-y-6">
              {post && (
                <button
                  onClick={handleShareToFeed}
                  disabled={isSharing}
                  className="w-full flex items-center gap-5 p-5 glass-aura rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                  </div>
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-widest block">Resonate to Flow</span>
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-1">Emit to public collective</span>
                  </div>
                </button>
              )}

              <div className="relative group">
                <div className="glass-aura rounded-2xl px-5 py-3.5 border border-white/5 focus-within:bg-white/10 transition-all">
                  <input
                    type="text"
                    placeholder="Search entities for direct beam..."
                    className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredFriends.map(friend => (
                  <button key={friend.id} onClick={() => onShareSuccess(`Sent to ${friend.displayName}`)} className="w-full flex items-center justify-between p-4 glass-aura rounded-2xl border border-white/5 hover:bg-white/5 transition-colors group text-left">
                    <div className="flex items-center gap-4">
                      <img src={friend.avatar} className="w-10 h-10 rounded-xl bg-slate-900 shadow-xl" alt="" />
                      <div>
                        <span className="font-bold text-white text-sm block">{friend.displayName}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">@{friend.username}</span>
                      </div>
                    </div>
                    <div className="px-5 py-2 bg-white/5 rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-white group-hover:text-black transition-all">Beam</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleExternalShare('whatsapp')}
                  className="flex flex-col items-center gap-4 p-8 glass-aura rounded-[2.5rem] border border-emerald-500/20 hover:bg-emerald-500/10 transition-all group"
                >
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-900/40 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">WhatsApp</span>
                </button>

                <button 
                  onClick={() => handleExternalShare('x')}
                  className="flex flex-col items-center gap-4 p-8 glass-aura rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="w-16 h-16 bg-white text-black rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">X / Twitter</span>
                </button>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between p-6 glass-aura rounded-[2rem] border border-cyan-500/20 hover:bg-cyan-500/5 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-cyan-500 text-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${copyFeedback ? 'text-cyan-400' : 'text-slate-300'}`}>
                      {copyFeedback ? 'Identifier Copied' : 'Nexus Identifier'}
                    </span>
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">Copy URL</div>
                </button>

                {navigator.share && (
                  <button 
                    onClick={() => handleExternalShare('native')}
                    className="w-full flex items-center justify-between p-6 glass-aura rounded-[2rem] border border-white/5 hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Aether System Share</span>
                    </div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">OS Level</div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
