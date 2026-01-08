
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { ALL_MOCK_USERS, CURRENT_USER, SUGGESTED_FRIENDS } from '../constants';
import ReportModal from '../components/ReportModal';
import { useFollow } from '../hooks/useFollow';
import FollowButton from '../components/FollowButton';

const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'suggested' | 'all'>('following');
  const [searchTerm, setSearchTerm] = useState('');
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [reportUser, setReportUser] = useState<User | null>(null);
  
  const { 
    isFollowing, 
    follow, 
    unfollow, 
    getFollowingUsers, 
    getFollowersUsers,
    followingCount,
    followerCount 
  } = useFollow(CURRENT_USER.id);

  useEffect(() => {
    const savedBlocked = localStorage.getItem(`nexus_blocked_${CURRENT_USER.id}`);
    if (savedBlocked) {
      setBlockedIds(JSON.parse(savedBlocked));
    }
  }, []);

  const handleFollowToggle = (userId: string) => {
    if (isFollowing(userId)) unfollow(userId);
    else follow(userId);
  };

  const displayUsers = useMemo(() => {
    let base: User[] = [];
    if (activeTab === 'following') base = getFollowingUsers();
    else if (activeTab === 'followers') base = getFollowersUsers();
    else if (activeTab === 'suggested') base = SUGGESTED_FRIENDS.filter(u => !isFollowing(u.id));
    else base = ALL_MOCK_USERS.filter(u => u.id !== CURRENT_USER.id);

    return base.filter(f => 
      !blockedIds.includes(f.id) && 
      (f.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activeTab, getFollowingUsers, getFollowersUsers, SUGGESTED_FRIENDS, isFollowing, blockedIds, searchTerm]);

  return (
    <div className="pb-32">
      <div className="mb-12">
        <h2 className="text-5xl font-display font-black text-white tracking-tighter mb-4">Neural Hub</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">Interpersonal Matrix</p>
      </div>

      {/* Tab Navigation with Reactive Badge Counts */}
      <div className="flex gap-8 mb-12 border-b border-white/5 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
        {[
          { id: 'following', label: 'Following', count: followingCount },
          { id: 'followers', label: 'Followers', count: followerCount },
          { id: 'suggested', label: 'Discover', count: null },
          { id: 'all', label: 'Collective', count: ALL_MOCK_USERS.length - 1 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative shrink-0 ${
              activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {tab.label}
              {tab.count !== null && (
                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black transition-all duration-500 ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-500'}`}>
                  {tab.count.toLocaleString()}
                </span>
              )}
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-40 transition-all duration-700"></div>
        <div className="relative glass-aura rounded-[2.5rem] p-2 pr-4 flex items-center refract-border border-white/10 group-focus-within:bg-white/[0.08]">
          <input
            type="text"
            placeholder="Search collective entities..."
            className="w-full bg-transparent border-none focus:outline-none px-8 py-5 text-sm font-medium text-white placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {displayUsers.map((friend) => {
          const isFollowingThisUser = isFollowing(friend.id);
          const liveFollowerCount = (friend.followers || 0) + (isFollowingThisUser ? 1 : 0);

          return (
            <div key={friend.id} className="glass-aura rounded-[3rem] p-8 refract-border border-white/5 group hover:bg-white/[0.04] transition-all duration-700 relative flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Link to={`/profile/${friend.username}`} className="flex items-center gap-5 group/avatar overflow-hidden">
                  <div className="relative shrink-0">
                     <div className="p-1 rounded-[1.8rem] bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 group-hover/avatar:scale-105 transition-transform">
                       <img src={friend.avatar} className="w-14 h-14 rounded-[1.6rem] object-cover bg-slate-900 shadow-2xl" alt="" />
                     </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-display font-black text-white tracking-tight group-hover/avatar:text-cyan-400 transition-colors truncate">{friend.displayName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em]">@{friend.username}</p>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="text-[8px] font-black text-cyan-500/80 uppercase tracking-widest">{liveFollowerCount.toLocaleString()} Syncs</span>
                    </div>
                  </div>
                </Link>
                
                <Link to={`/chat?username=${friend.username}`} className="w-10 h-10 glass-aura rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </Link>
              </div>
              
              <div className="mt-6">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic line-clamp-1 mb-6">"{friend.bio}"</p>
                <FollowButton 
                  isFollowing={isFollowingThisUser} 
                  onClick={() => handleFollowToggle(friend.id)}
                  className="w-full"
                  size="md"
                />
              </div>
            </div>
          );
        })}
      </div>

      {displayUsers.length === 0 && (
        <div className="py-40 text-center glass-aura rounded-[4rem] opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">Sector Empty.</p>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
