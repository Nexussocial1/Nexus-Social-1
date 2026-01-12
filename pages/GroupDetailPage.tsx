import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Group, Post, User } from '../types';
import PostCard from '../components/PostCard';
import InviteModal from '../components/InviteModal';
import { useFollow } from '../hooks/useFollow';
import { generateAIImage } from '../geminiService';
import { ALL_MOCK_USERS } from '../constants';

interface GroupDetailPageProps {
  currentUser: User;
}

const GroupDetailPage: React.FC<GroupDetailPageProps> = ({ currentUser }) => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'flow' | 'members' | 'admin'>('flow');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Composer state
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getFollowingUsers } = useFollow(currentUser.id);

  useEffect(() => {
    const savedGroups = localStorage.getItem('nexus_groups');
    const groups: Group[] = savedGroups ? JSON.parse(savedGroups) : [];
    const foundGroup = groups.find(g => g.id === groupId);
    
    if (foundGroup) {
      setGroup(foundGroup);
      const savedPosts = localStorage.getItem('nexus_posts');
      const allPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];
      setPosts(allPosts.filter(p => p.groupId === groupId));
    } else {
      navigate('/groups');
    }
  }, [groupId, navigate]);

  const isOwner = group?.ownerId === currentUser.id;
  const isMember = group?.memberIds.includes(currentUser.id);
  const isRestricted = group?.restrictedIds?.includes(currentUser.id);

  const handleToggleJoin = () => {
    if (!group || isRestricted) return;
    const updatedGroup = {
      ...group,
      memberIds: isMember 
        ? group.memberIds.filter(id => id !== currentUser.id)
        : [...group.memberIds, currentUser.id]
    };
    setGroup(updatedGroup);
    
    const savedGroups = localStorage.getItem('nexus_groups');
    const groups: Group[] = savedGroups ? JSON.parse(savedGroups) : [];
    const newGroups = groups.map(g => g.id === group.id ? updatedGroup : g);
    localStorage.setItem('nexus_groups', JSON.stringify(newGroups));
  };

  const handlePost = () => {
    if (!group || !composerText.trim() || !isMember || isRestricted) return;

    const newPost: Post = {
      id: `p-group-${Date.now()}`,
      userId: currentUser.id,
      groupId: group.id,
      authorName: currentUser.displayName,
      authorAvatar: currentUser.avatar,
      content: composerText,
      imageUrl: composerImage || undefined,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      commentsList: []
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    
    const savedPosts = localStorage.getItem('nexus_posts');
    const allPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];
    localStorage.setItem('nexus_posts', JSON.stringify([newPost, ...allPosts]));

    setComposerText('');
    setComposerImage(null);
  };

  const handleDeletePost = (postId: string) => {
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    const savedPosts = localStorage.getItem('nexus_posts');
    const allPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];
    localStorage.setItem('nexus_posts', JSON.stringify(allPosts.filter(p => p.id !== postId)));
  };

  const handleAdminAction = (userId: string, action: 'remove' | 'restrict' | 'lift') => {
    if (!group || !isOwner) return;
    let updatedGroup = { ...group };
    
    if (action === 'remove') {
      updatedGroup.memberIds = updatedGroup.memberIds.filter(id => id !== userId);
    } else if (action === 'restrict') {
      updatedGroup.restrictedIds = [...(updatedGroup.restrictedIds || []), userId];
      updatedGroup.memberIds = updatedGroup.memberIds.filter(id => id !== userId);
    } else if (action === 'lift') {
      updatedGroup.restrictedIds = updatedGroup.restrictedIds?.filter(id => id !== userId);
    }

    setGroup(updatedGroup);
    const savedGroups = localStorage.getItem('nexus_groups');
    const groups: Group[] = savedGroups ? JSON.parse(savedGroups) : [];
    localStorage.setItem('nexus_groups', JSON.stringify(groups.map(g => g.id === group.id ? updatedGroup : g)));
  };

  if (!group) return null;

  const groupMembers = ALL_MOCK_USERS.filter(u => group.memberIds.includes(u.id));
  const restrictedUsers = ALL_MOCK_USERS.filter(u => group.restrictedIds?.includes(u.id));

  return (
    <div className="pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Group Header */}
      <div className="relative h-64 w-full rounded-b-[4rem] overflow-hidden refract-border border-white/5 mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-black animate-aura"></div>
        {group.coverImage && <img src={group.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="" />}
        
        <Link to="/groups" className="absolute top-10 left-10 w-12 h-12 glass-aura rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-10 relative -mt-32">
        <div className="flex flex-col md:flex-row items-end gap-10 mb-12">
          <div className="w-48 h-48 rounded-[3rem] glass-aura p-2 refract-border border-white/20 shadow-2xl overflow-hidden bg-[#0d1117]">
            <img src={group.avatar} className="w-full h-full rounded-[2.5rem] object-cover" alt="" />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-5xl font-display font-black text-white tracking-tighter mb-2 uppercase">{group.name}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400">Cluster Frequency</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span className="text-[10px] font-black uppercase text-slate-500">{group.privacy} Integrity</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Link to={`/chat?type=group&id=${group.id}`} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all refract-border">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </Link>
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all refract-border"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </button>
                {!isRestricted && (
                  <button 
                    onClick={handleToggleJoin}
                    className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all ${
                      isMember 
                        ? 'glass-aura text-indigo-400 ring-1 ring-indigo-500/30' 
                        : 'bg-white text-black hover:scale-105 shadow-xl shadow-white/10'
                    }`}
                  >
                    {isMember ? 'Synced' : 'Initiate Sync'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab System */}
        <div className="flex gap-10 border-b border-white/5 mb-12 sticky top-24 bg-[#02040a]/80 backdrop-blur-xl z-20">
          {(['flow', 'members'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${
                activeTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>}
            </button>
          ))}
          {isOwner && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${
                activeTab === 'admin' ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'
              }`}
            >
              Admin Matrix
              {activeTab === 'admin' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.8)]"></div>}
            </button>
          )}
        </div>

        {activeTab === 'flow' && (
          <>
            {isMember && !isRestricted && (
              <div className="glass-aura rounded-[3rem] p-10 refract-border border-white/5 mb-16 bg-white/[0.02]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8">Cluster Transmission</h3>
                <div className="space-y-6">
                  <textarea 
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Contribute to the collective resonance..."
                    className="w-full bg-transparent border-none focus:outline-none text-white text-xl font-light h-32 resize-none"
                  />
                  {composerImage && <img src={composerImage} className="w-full rounded-[2.5rem] border border-white/10" alt="" />}
                  <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setComposerImage(reader.result as string); reader.readAsDataURL(file); } }} />
                    <div className="flex-1"></div>
                    <button onClick={handlePost} disabled={!composerText.trim()} className="px-14 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl">Emit</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-16">
              {posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} onDeletePost={isOwner ? handleDeletePost : undefined} onUpdatePost={(updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))} />)
              ) : (
                <div className="py-40 text-center glass-aura rounded-[4rem] opacity-30 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">Cluster flow is currently static.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <div className="grid gap-6 animate-in fade-in">
             {groupMembers.map(member => (
               <div key={member.id} className="p-6 glass-aura rounded-[2.5rem] border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <img src={member.avatar} className="w-14 h-14 rounded-2xl object-cover bg-slate-900" alt="" />
                    <div>
                      <h4 className="font-bold text-white uppercase tracking-widest text-sm">{member.displayName}</h4>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">@{member.username}</p>
                    </div>
                  </div>
                  {member.id === group.ownerId && <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-400/20 px-3 py-1.5 rounded-full">Origin Node</span>}
               </div>
             ))}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-12 animate-in fade-in">
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-8">Member Control Matrix</h3>
              <div className="grid gap-4">
                {groupMembers.filter(m => m.id !== currentUser.id).map(member => (
                  <div key={member.id} className="p-5 glass-aura rounded-3xl border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <img src={member.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">@{member.username}</span>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => handleAdminAction(member.id, 'remove')} className="px-5 py-2 glass-aura text-[9px] font-black uppercase text-slate-400 hover:text-white rounded-xl">Expel</button>
                        <button onClick={() => handleAdminAction(member.id, 'restrict')} className="px-5 py-2 glass-aura text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-xl">Restrict</button>
                     </div>
                  </div>
                ))}
                {groupMembers.length <= 1 && <p className="text-[10px] text-slate-600 italic uppercase text-center py-10">No other entities in cluster.</p>}
              </div>
            </section>

            {restrictedUsers.length > 0 && (
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-8">Restricted Frequencies</h3>
                <div className="grid gap-4">
                  {restrictedUsers.map(user => (
                    <div key={user.id} className="p-5 glass-aura rounded-3xl border border-white/5 flex items-center justify-between opacity-60">
                       <div className="flex items-center gap-4">
                          <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover grayscale" alt="" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">@{user.username}</span>
                       </div>
                       <button onClick={() => handleAdminAction(user.id, 'lift')} className="px-5 py-2 glass-aura text-[9px] font-black uppercase text-indigo-400 hover:text-white rounded-xl">Restore Signal</button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <InviteModal 
        targetName={group.name}
        targetType="group"
        friends={getFollowingUsers()}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default GroupDetailPage;
