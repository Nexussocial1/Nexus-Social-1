import React, { useState, useEffect, useMemo } from 'react';
import { User, Group, Page } from '../types';
import CreateEntityModal from '../components/CreateEntityModal';
import InviteModal from '../components/InviteModal';
import { Link } from 'react-router-dom';
import { useFollow } from '../hooks/useFollow';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface HubPageProps {
  type: 'groups' | 'pages';
  currentUser: User;
}

const HubPage: React.FC<HubPageProps> = ({ type, currentUser }) => {
  const [entities, setEntities] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeHubTab, setActiveHubTab] = useState<'all' | 'mine'>('all');
  const [inviteTarget, setInviteTarget] = useState<{name: string, type: 'group' | 'page'} | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { getFollowingUsers } = useFollow(currentUser.id);

  useEffect(() => {
    const colRef = collection(db, type);
    const q = query(colRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEntities(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [type]);

  const handleToggleSync = async (entity: any) => {
    const idListKey = type === 'groups' ? 'memberIds' : 'followerIds';
    const isMember = entity[idListKey].includes(currentUser.id);
    const entityRef = doc(db, type, entity.id);
    
    try {
      if (isMember) {
        await updateDoc(entityRef, { [idListKey]: arrayRemove(currentUser.id) });
      } else {
        await updateDoc(entityRef, { [idListKey]: arrayUnion(currentUser.id) });
      }
    } catch (err) {
      console.error("Sync state toggle failed:", err);
    }
  };

  const filtered = useMemo(() => {
    let base = entities;
    const idListKey = type === 'groups' ? 'memberIds' : 'followerIds';
    
    if (activeHubTab === 'mine') {
      base = base.filter(e => e[idListKey]?.includes(currentUser.id) || e.ownerId === currentUser.id);
    }

    return base.filter(e => 
      e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entities, searchTerm, activeHubTab, type, currentUser.id]);

  return (
    <div className="pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-16">
        <div>
          <h2 className="text-5xl font-display font-black text-white tracking-tighter uppercase mb-3">
            {type === 'groups' ? 'Clusters' : 'Portals'}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">
            {type === 'groups' ? 'Synchronize with communities' : 'Tune into interesting frequencies'}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-10 py-5 bg-white text-black rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          Initialize New
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-12">
        <div className="flex-1 group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-all duration-700"></div>
          <div className="relative glass-aura rounded-full px-8 py-5 refract-border border-white/10 flex items-center gap-6 focus-within:bg-white/5 transition-all bg-black/20">
            <svg className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder={`Search ${type}...`} 
              className="bg-transparent border-none focus:outline-none text-white text-base font-medium placeholder:text-slate-700 flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex p-2 glass-aura rounded-[2rem] refract-border border-white/5 bg-black/20">
           <button 
             onClick={() => setActiveHubTab('all')}
             className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeHubTab === 'all' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}
           >
             Public
           </button>
           <button 
             onClick={() => setActiveHubTab('mine')}
             className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeHubTab === 'mine' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}
           >
             Synced
           </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
          <div className="w-10 h-10 border-2 border-white/5 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Reconstructing patterns...</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entity) => {
            const idListKey = type === 'groups' ? 'memberIds' : 'followerIds';
            const isJoined = entity[idListKey]?.includes(currentUser.id);
            const detailUrl = type === 'groups' ? `/group/${entity.id}` : `/page/${entity.id}`;
            
            return (
              <div 
                key={entity.id} 
                className="glass-aura rounded-[3rem] p-8 refract-border border-white/5 group hover:bg-white/[0.04] transition-all duration-700 relative overflow-hidden flex flex-col justify-between shadow-2xl"
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`p-1 rounded-[2rem] bg-gradient-to-tr ${type === 'groups' ? 'from-indigo-500/30 to-purple-500/30' : 'from-cyan-500/30 to-blue-500/30'} group-hover:scale-110 transition-transform`}>
                      <img src={entity.avatar} className={`w-16 h-16 object-cover bg-slate-900 shadow-2xl ${type === 'groups' ? 'rounded-[1.8rem]' : 'rounded-full'}`} alt="" />
                    </div>
                  </div>
                  <h4 className="text-xl font-display font-black text-white tracking-tight mb-3 group-hover:text-indigo-400 transition-colors">{entity.name}</h4>
                  <p className="text-xs text-slate-500 font-light leading-relaxed line-clamp-3 mb-8 italic">"{entity.description}"</p>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {type === 'groups' ? `${entity.memberIds?.length || 0} Members` : `${entity.followerIds?.length || 0} Following`}
                  </span>
                  <div className="flex gap-2">
                    <Link to={detailUrl} className="px-4 py-2.5 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                      View
                    </Link>
                    <button 
                      onClick={() => handleToggleSync(entity)}
                      className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isJoined ? 'glass-aura text-cyan-400 ring-1 ring-cyan-500/20' : 'bg-white text-black hover:scale-105 shadow-xl shadow-white/5'}`}
                    >
                      {isJoined ? 'Synced' : 'Sync'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateEntityModal 
        type={type === 'groups' ? 'group' : 'page'} 
        currentUser={currentUser} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={() => {}}
      />
    </div>
  );
};

export default HubPage;
