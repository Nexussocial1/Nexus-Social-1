import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Post, Group, Page } from '../types';
import { useReport } from '../hooks/useReport';
import { ALL_MOCK_USERS } from '../constants';
import PostCard from '../components/PostCard';
import CreateEntityModal from '../components/CreateEntityModal';
import InviteModal from '../components/InviteModal';
import { useFollow } from '../hooks/useFollow';

interface SettingsPageProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onUpdateUser }) => {
  const { tab = 'account' } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { savedPostIds, reportedUserIds, mutedUserIds, unblockUser, unmuteUser } = useReport(currentUser.id);
  const { getFollowingUsers } = useFollow(currentUser.id);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [region, setRegion] = useState('Global');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [myPages, setMyPages] = useState<Page[]>([]);
  const [inviteTarget, setInviteTarget] = useState<{name: string, type: 'group' | 'page'} | null>(null);
  
  const [editUser, setEditUser] = useState({
    displayName: currentUser.displayName,
    bio: currentUser.bio
  });

  const loadGroups = useCallback(() => {
    const saved = localStorage.getItem('nexus_groups');
    if (saved) {
      const all: Group[] = JSON.parse(saved);
      const filtered = all.filter(g => g.memberIds.includes(currentUser.id) || g.ownerId === currentUser.id);
      setMyGroups(filtered);
    }
  }, [currentUser.id]);

  const loadPages = useCallback(() => {
    const saved = localStorage.getItem('nexus_pages');
    if (saved) {
      const all: Page[] = JSON.parse(saved);
      const filtered = all.filter(p => p.followerIds.includes(currentUser.id) || p.ownerId === currentUser.id);
      setMyPages(filtered);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadGroups();
    loadPages();
  }, [loadGroups, loadPages, tab]);

  useEffect(() => {
    setEditUser({
      displayName: currentUser.displayName,
      bio: currentUser.bio
    });
  }, [currentUser]);

  const [checkupStep, setCheckupStep] = useState(0);

  const savedPosts = useMemo(() => {
    const savedContentKey = `nexus_saved_content_${currentUser.id}`;
    const savedContentStr = localStorage.getItem(savedContentKey);
    const savedContent: Post[] = savedContentStr ? JSON.parse(savedContentStr) : [];
    return savedContent.filter(p => savedPostIds.includes(p.id));
  }, [savedPostIds, currentUser.id]);

  const resolvedBlockedUsers = useMemo(() => 
    ALL_MOCK_USERS.filter(u => reportedUserIds.includes(u.id)),
    [reportedUserIds]
  );

  const resolvedMutedUsers = useMemo(() => 
    ALL_MOCK_USERS.filter(u => mutedUserIds.includes(u.id)),
    [mutedUserIds]
  );

  const menuItems = [
    { id: 'account', label: 'Account', icon: '👤', desc: 'Personal Information' },
    { id: 'clusters', label: 'Groups', icon: '🌀', desc: 'My Joined Groups' },
    { id: 'portals', label: 'Pages', icon: '📡', desc: 'My Followed Pages' },
    { id: 'saved', label: 'Saved', icon: '💾', desc: 'Saved Posts' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️', desc: 'Blocks & Safety' },
    { id: 'language', label: 'Language', icon: '🌐', desc: 'Language Settings' },
  ];

  const handleUpdateAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    onUpdateUser({ ...currentUser, avatar: newAvatar });
  };

  const handleSyncAccount = () => {
    onUpdateUser({
      ...currentUser,
      displayName: editUser.displayName,
      bio: editUser.bio
    });
  };

  const handleLeaveGroup = (groupId: string) => {
    const saved = localStorage.getItem('nexus_groups');
    if (saved) {
      const all: Group[] = JSON.parse(saved);
      const updated = all.map(g => {
        if (g.id === groupId) {
          return { ...g, memberIds: g.memberIds.filter(id => id !== currentUser.id) };
        }
        return g;
      });
      localStorage.setItem('nexus_groups', JSON.stringify(updated));
      loadGroups();
    }
  };

  const handleUnfollowPage = (pageId: string) => {
    const saved = localStorage.getItem('nexus_pages');
    if (saved) {
      const all: Page[] = JSON.parse(saved);
      const updated = all.map(p => {
        if (p.id === pageId) {
          return { ...p, followerIds: p.followerIds.filter(id => id !== currentUser.id) };
        }
        return p;
      });
      localStorage.setItem('nexus_pages', JSON.stringify(updated));
      loadPages();
    }
  };

  return (
    <div className="pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-16 flex items-end justify-between">
        <div>
          <h2 className="text-5xl font-display font-black text-white tracking-tighter uppercase mb-3">Settings</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">Account Configuration</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsGroupModalOpen(true)}
            className="hidden md:flex px-8 py-5 glass-aura text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all refract-border items-center gap-3"
          >
            Create Group
          </button>
          <button 
            onClick={() => setIsPageModalOpen(true)}
            className="hidden md:flex px-10 py-5 bg-white text-black rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] hover:scale-110 active:scale-95 transition-all shadow-xl items-center gap-3"
          >
            Create Page
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-80 space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(`/settings/${item.id}`);
                if (item.id !== 'privacy') setCheckupStep(0);
              }}
              className={`w-full text-left p-6 rounded-[2.5rem] transition-all duration-500 border group ${
                tab === item.id 
                  ? 'glass-aura border-cyan-500/30 bg-white/10 shadow-[0_0_30px_rgba(34,211,238,0.1)]' 
                  : 'border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-5">
                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <div>
                  <h4 className={`text-sm font-black uppercase tracking-widest ${tab === item.id ? 'text-white' : 'text-slate-400'}`}>{item.label}</h4>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mt-1">{item.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="glass-aura rounded-[4rem] p-12 refract-border border-white/5 min-h-[600px] relative overflow-hidden bg-[#0d1117]/40">
            {tab === 'account' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 mb-8">Personal Info</h3>
                  <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-white/[0.02] rounded-[3rem] border border-white/5">
                    <div className="relative group/avatar">
                      <div className="w-32 h-32 rounded-[2.5rem] glass-aura p-2 refract-border border-white/20 overflow-hidden bg-slate-900 shadow-2xl">
                        <img src={currentUser.avatar} className="w-full h-full object-cover rounded-[2rem]" alt="" />
                      </div>
                      <button onClick={handleUpdateAvatar} className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform ring-4 ring-[#0d1117]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h4 className="text-3xl font-display font-black text-white tracking-tight">{currentUser.displayName}</h4>
                      <p className="text-xs text-indigo-400 font-black uppercase tracking-widest mt-1">@{currentUser.username}</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                      <div className="glass-aura rounded-2xl px-6 py-4 border border-white/5 focus-within:bg-white/10 transition-all">
                        <input 
                          type="text" 
                          value={editUser.displayName} 
                          onChange={(e) => setEditUser({...editUser, displayName: e.target.value})}
                          className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Email</label>
                      <div className="glass-aura rounded-2xl px-6 py-4 border border-white/5 opacity-50 cursor-not-allowed">
                        <input type="email" value={currentUser.email} disabled className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium" />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Bio</label>
                      <div className="glass-aura rounded-3xl px-6 py-4 border border-white/5 focus-within:bg-white/10 transition-all">
                        <textarea 
                          className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium h-24 resize-none" 
                          value={editUser.bio} 
                          onChange={(e) => setEditUser({...editUser, bio: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pt-6">
                  <button 
                    onClick={handleSyncAccount}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-900/40"
                  >
                    Save Changes
                  </button>
                </section>
              </div>
            )}

            {tab === 'clusters' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">My Groups ({myGroups.length})</h3>
                  <button onClick={() => navigate('/groups')} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Discover More</button>
                </div>

                {myGroups.length > 0 ? (
                  <div className="grid gap-6">
                    {myGroups.map(group => (
                      <div key={group.id} className="p-6 glass-aura rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group">
                         <div className="flex items-center gap-6 flex-1">
                            <img src={group.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover bg-slate-900 shadow-xl" alt="" />
                            <div className="overflow-hidden">
                               <h4 className="text-lg font-display font-black text-white truncate">{group.name}</h4>
                               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{group.memberIds.length} Members</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <button onClick={() => setInviteTarget({name: group.name, type: 'group'})} className="px-6 py-3 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all">Invite</button>
                            <Link to={`/group/${group.id}`} className="px-6 py-3 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 transition-all">View</Link>
                            <button onClick={() => handleLeaveGroup(group.id)} className="px-6 py-3 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all">Leave</button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-32 text-center glass-aura rounded-[3rem] border border-dashed border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic mb-8">Not in any groups.</p>
                    <button onClick={() => navigate('/groups')} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 shadow-xl">Join a Group</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'portals' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Followed Pages ({myPages.length})</h3>
                  <button onClick={() => navigate('/pages')} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Discover More</button>
                </div>

                {myPages.length > 0 ? (
                  <div className="grid gap-6">
                    {myPages.map(page => (
                      <div key={page.id} className="p-6 glass-aura rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group">
                         <div className="flex items-center gap-6 flex-1">
                            <img src={page.avatar} className="w-16 h-16 rounded-full object-cover bg-slate-900 shadow-xl" alt="" />
                            <div className="overflow-hidden">
                               <h4 className="text-lg font-display font-black text-white truncate">{page.name}</h4>
                               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{page.followerIds.length} Followers</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <button onClick={() => setInviteTarget({name: page.name, type: 'page'})} className="px-6 py-3 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-all">Invite</button>
                            <Link to={`/page/${page.id}`} className="px-6 py-3 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/10 transition-all">View</Link>
                            <button onClick={() => handleUnfollowPage(page.id)} className="px-6 py-3 glass-aura rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all">Unfollow</button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-32 text-center glass-aura rounded-[3rem] border border-dashed border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic mb-8">No followed pages.</p>
                    <button onClick={() => navigate('/pages')} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 shadow-xl">Browse Pages</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'saved' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Saved Posts ({savedPosts.length})</h3>
                </div>
                {savedPosts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-12">
                    {savedPosts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)}
                  </div>
                ) : (
                  <div className="py-48 text-center glass-aura rounded-[3rem] opacity-30 italic">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">No saved posts.</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'privacy' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-8">Blocked Users</h3>
                  {resolvedBlockedUsers.length > 0 ? (
                    <div className="space-y-4">
                      {resolvedBlockedUsers.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-5 glass-aura rounded-[2rem] border border-rose-500/10">
                          <div className="flex items-center gap-4">
                            <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                            <span className="text-xs font-bold text-white">@{user.username}</span>
                          </div>
                          <button onClick={() => unblockUser(user.id)} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-white">Unblock</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600 uppercase text-center py-10">No blocked users.</p>
                  )}
                </section>
              </div>
            )}

            {tab === 'language' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                <section className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Language</h3>
                  <div className="grid gap-4">
                    {['English', 'Spanish', 'French', 'German'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`p-6 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          language === lang ? 'glass-aura border-cyan-500/30 text-white' : 'border-white/5 text-slate-500 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">{lang}</span>
                        {language === lang && <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]"></div>}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateEntityModal type="group" currentUser={currentUser} isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onCreated={() => { loadGroups(); navigate('/groups'); }} />
      <CreateEntityModal type="page" currentUser={currentUser} isOpen={isPageModalOpen} onClose={() => setIsPageModalOpen(false)} onCreated={() => { loadPages(); navigate('/pages'); }} />
      {inviteTarget && <InviteModal targetName={inviteTarget.name} targetType={inviteTarget.type} friends={getFollowingUsers()} isOpen={!!inviteTarget} onClose={() => setInviteTarget(null)} />}
    </div>
  );
};

export default SettingsPage;
