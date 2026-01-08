
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ALL_MOCK_USERS } from '../constants';
import { Group, Page } from '../types';

const RightSidebar: React.FC = () => {
  const onlineUsers = ALL_MOCK_USERS.filter(u => u.id !== 'me').slice(0, 5);
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [suggestedPages, setSuggestedPages] = useState<Page[]>([]);

  useEffect(() => {
    // Load suggested clusters
    const savedGroups = localStorage.getItem('nexus_groups');
    if (savedGroups) {
      const all: Group[] = JSON.parse(savedGroups);
      setSuggestedGroups(all.slice(0, 2));
    } else {
      const mock: Group[] = [{ id: 'g1', name: 'Neural Architects', description: 'Future of web frequencies.', avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=Arch', memberIds: ['u4'], ownerId: 'u4', privacy: 'public' }];
      setSuggestedGroups(mock);
    }

    // Load suggested portals
    const savedPages = localStorage.getItem('nexus_pages');
    if (savedPages) {
      const all: Page[] = JSON.parse(savedPages);
      setSuggestedPages(all.slice(0, 2));
    } else {
      const mock: Page[] = [{ id: 'pg1', name: 'Synapse Daily', description: 'Your daily resonance from the cluster.', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Syn', category: 'News', followerIds: ['u5'], ownerId: 'u5' }];
      setSuggestedPages(mock);
    }
  }, []);

  return (
    <aside className="w-[360px] hidden xl:flex flex-col p-10 fixed top-24 right-0 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
      {/* Discovery Sparks */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/60">Neural Sparks</h3>
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]"></div>
        </div>
        <div className="space-y-6">
          <SparkCard 
            title="Aura Kinetic: The Evolution of Web UI" 
            meta="Design Node" 
            img="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=300&auto=format&fit=crop" 
          />
          <SparkCard 
            title="Synaptic Networks & Collective Thought" 
            meta="Sci-Tech" 
            img="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=300&auto=format&fit=crop" 
          />
        </div>
      </div>

      {/* Suggested Clusters */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">Resonance Clusters</h3>
          <Link to="/groups" className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Explore All</Link>
        </div>
        <div className="space-y-4">
          {suggestedGroups.map(group => (
            <div key={group.id} className="p-5 glass-aura rounded-3xl border border-white/5 hover:bg-white/5 transition-all group/groupitem">
              <div className="flex items-center gap-4 mb-4">
                <img src={group.avatar} className="w-10 h-10 rounded-xl bg-slate-900 shadow-xl" alt="" />
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate">{group.name}</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">{group.memberIds.length} synced</p>
                </div>
              </div>
              <Link to={`/group/${group.id}`} className="w-full py-2.5 glass-aura rounded-xl text-[8px] font-black uppercase tracking-widest text-center block text-indigo-400 group-hover/groupitem:bg-white group-hover/groupitem:text-black transition-all">
                Synchronize
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Portals */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/60">Active Portals</h3>
          <Link to="/pages" className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Explore All</Link>
        </div>
        <div className="space-y-4">
          {suggestedPages.map(page => (
            <div key={page.id} className="p-5 glass-aura rounded-3xl border border-white/5 hover:bg-white/5 transition-all group/portalitem">
              <div className="flex items-center gap-4 mb-4">
                <img src={page.avatar} className="w-10 h-10 rounded-full object-cover bg-slate-900 shadow-xl" alt="" />
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate">{page.name}</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">{page.followerIds.length} tuned in</p>
                </div>
              </div>
              <Link to={`/page/${page.id}`} className="w-full py-2.5 glass-aura rounded-xl text-[8px] font-black uppercase tracking-widest text-center block text-cyan-400 group-hover/portalitem:bg-white group-hover/portalitem:text-black transition-all">
                Access Portal
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Neural Network (Contacts) */}
      <div className="flex-1 pb-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">Entity Stream</h3>
          <button className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Sync</button>
        </div>
        <div className="space-y-4">
          {onlineUsers.map(friend => (
            <Link 
              key={friend.id} 
              to={`/chat?username=${friend.username}`} 
              className="flex items-center gap-5 p-3 rounded-2xl transition-all group border border-transparent hover:bg-white/[0.03] hover:border-white/5"
            >
              <div className="relative shrink-0">
                <div className="p-0.5 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 group-hover:scale-110 transition-transform">
                  <img src={friend.avatar} className="w-10 h-10 rounded-lg object-cover bg-slate-900" alt={friend.displayName} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-4 border-[#02040a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-200 truncate tracking-tight">{friend.displayName}</p>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                   <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Active Resonance</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

const SparkCard = ({ title, meta, img }: any) => (
  <button className="w-full group text-left">
    <div className="relative h-32 rounded-[2rem] overflow-hidden mb-4 refract-border border-white/5">
      <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt="spark" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div className="absolute bottom-4 left-5">
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-400 glow-text">{meta}</span>
      </div>
    </div>
    <h4 className="text-sm font-black text-slate-300 leading-snug group-hover:text-white transition-colors px-1">{title}</h4>
  </button>
);

export default RightSidebar;
