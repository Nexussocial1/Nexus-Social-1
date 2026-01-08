
import React, { useState } from 'react';
import { User, Group, Page } from '../types';

interface CreateEntityModalProps {
  type: 'group' | 'page';
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (entity: any) => void;
}

const CreateEntityModal: React.FC<CreateEntityModalProps> = ({ type, currentUser, isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seed, setSeed] = useState(Math.random().toString(36).substring(7));
  const [extra, setExtra] = useState(type === 'group' ? 'public' : 'Technology'); // Privacy or Category
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const avatar = `https://api.dicebear.com/7.x/${type === 'group' ? 'shapes' : 'identicon'}/svg?seed=${seed}`;
      
      if (type === 'group') {
        const newGroup: Group = {
          id: `g-${Date.now()}`,
          name: name.trim(),
          description: description.trim(),
          avatar,
          memberIds: [currentUser.id],
          ownerId: currentUser.id,
          privacy: extra as 'public' | 'private'
        };
        const saved = localStorage.getItem('nexus_groups');
        const groups = saved ? JSON.parse(saved) : [];
        localStorage.setItem('nexus_groups', JSON.stringify([...groups, newGroup]));
        onCreated(newGroup);
      } else {
        const newPage: Page = {
          id: `pg-${Date.now()}`,
          name: name.trim(),
          description: description.trim(),
          avatar,
          category: extra,
          followerIds: [currentUser.id],
          ownerId: currentUser.id
        };
        const saved = localStorage.getItem('nexus_pages');
        const pages = saved ? JSON.parse(saved) : [];
        localStorage.setItem('nexus_pages', JSON.stringify([...pages, newPage]));
        onCreated(newPage);
      }
      
      setLoading(false);
      onClose();
      setName('');
      setDescription('');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}>
      <div 
        className="glass-aura w-full max-w-lg rounded-[3.5rem] overflow-hidden animate-in zoom-in-95 duration-500 refract-border border-white/10 shadow-2xl bg-[#0d1117]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="text-2xl font-display font-black text-white tracking-tight uppercase">Forge {type === 'group' ? 'Cluster' : 'Portal'}</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1">Initialize a new collective identity</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="flex justify-center mb-4">
             <div className="relative group/avatar">
               <div className="w-32 h-32 rounded-[2.5rem] glass-aura p-2 refract-border border-white/10 overflow-hidden bg-black/20">
                  <img src={`https://api.dicebear.com/7.x/${type === 'group' ? 'shapes' : 'identicon'}/svg?seed=${seed}`} className="w-full h-full object-cover" alt="seed" />
               </div>
               <button onClick={() => setSeed(Math.random().toString(36).substring(7))} className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               </button>
             </div>
          </div>

          <div className="space-y-6">
            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Identifier Name</label>
              <div className="glass-aura rounded-2xl px-6 py-4 refract-border border-white/5 focus-within:bg-white/5 transition-all">
                <input
                  type="text"
                  placeholder={`E.g. ${type === 'group' ? 'Neural Architects' : 'Synapse Daily'}`}
                  className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Neural Description</label>
              <div className="glass-aura rounded-2xl px-6 py-4 refract-border border-white/5 focus-within:bg-white/5 transition-all">
                <textarea
                  placeholder="Define the frequency of this collective..."
                  className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium resize-none h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">
                {type === 'group' ? 'Integrity Level' : 'Synthesis Sector'}
              </label>
              <div className="glass-aura rounded-2xl px-6 py-4 refract-border border-white/5 focus-within:bg-white/5 transition-all">
                {type === 'group' ? (
                  <select 
                    className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium appearance-none"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                  >
                    <option value="public" className="bg-[#0d1117]">Public Spectrum</option>
                    <option value="private" className="bg-[#0d1117]">Private Frequency</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="E.g. Technology, Art, Science"
                    className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : `Initialize ${type === 'group' ? 'Cluster' : 'Portal'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEntityModal;
