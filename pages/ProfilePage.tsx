
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Post } from '../types';
import PostCard from '../components/PostCard';
import UsersModal from '../components/UsersModal';
import InviteModal from '../components/InviteModal';
import ShareModal from '../components/ShareModal';
import ReportModal from '../components/ReportModal';
import FollowButton from '../components/FollowButton';
import { SUGGESTED_FRIENDS, INITIAL_POSTS, ALL_MOCK_USERS } from '../constants';
import { useFollow } from '../hooks/useFollow';

interface ProfilePageProps {
  currentUser: User;
  onUpdateUser?: (updatedUser: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateUser }) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  
  const { 
    follow, 
    unfollow, 
    isFollowing, 
    getFollowingUsers, 
    getFollowersUsers, 
    followingCount, 
    followerCount 
  } = useFollow(currentUser.id);

  const [userModal, setUserModal] = useState<{ isOpen: boolean; title: string; users: User[] }>({
    isOpen: false,
    title: '',
    users: []
  });

  const [editData, setEditData] = useState({
    displayName: currentUser.displayName,
    bio: currentUser.bio,
    avatar: currentUser.avatar,
    avatarSeed: currentUser.username, 
    location: currentUser.location || '',
    work: currentUser.work || '',
    school: currentUser.school || '',
    nickname: currentUser.nickname || '',
    religion: currentUser.religion || '',
    politicalParty: currentUser.politicalParty || '',
    relationshipStatus: currentUser.relationshipStatus || '',
  });

  // Explicitly typing profileUser as User to resolve union property access errors
  const profileUser: User = useMemo(() => {
    if (!username || username === currentUser.username) return currentUser;
    
    const foundUser = ALL_MOCK_USERS.find(f => f.username.toLowerCase() === username.toLowerCase());
    if (foundUser) return foundUser;

    return {
      id: `u-${username}`,
      username: username,
      displayName: username.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      email: `${username}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      bio: `Hello! I am @${username}.`,
      followers: 100,
      following: 100,
      postsCount: 12,
    };
  }, [username, currentUser]);

  const isOwnProfile = profileUser.id === currentUser.id;
  const followingThisUser = isFollowing(profileUser.id);

  useEffect(() => {
    if (isOwnProfile) {
      setEditData({
        displayName: currentUser.displayName,
        bio: currentUser.bio,
        avatar: currentUser.avatar,
        avatarSeed: editData.avatarSeed || currentUser.username,
        location: currentUser.location || '',
        work: currentUser.work || '',
        school: currentUser.school || '',
        nickname: currentUser.nickname || '',
        religion: currentUser.religion || '',
        politicalParty: currentUser.politicalParty || '',
        relationshipStatus: currentUser.relationshipStatus || '',
      });
    }
  }, [currentUser, isOwnProfile]);

  const displayFollowers = useMemo(() => {
    if (isOwnProfile) return followerCount;
    const base = profileUser.followers || 0;
    return followingThisUser ? base + 1 : base;
  }, [isOwnProfile, followerCount, profileUser.followers, followingThisUser]);

  const displayFollowing = useMemo(() => {
    if (isOwnProfile) return followingCount;
    return profileUser.following || 0;
  }, [isOwnProfile, followingCount, profileUser.following]);

  useEffect(() => {
    const savedBlocked = localStorage.getItem(`nexus_blocked_${currentUser.id}`);
    if (savedBlocked) {
      const blockedIds: string[] = JSON.parse(savedBlocked);
      if (profileUser && blockedIds.includes(profileUser.id)) {
        setIsBlocked(true);
      }
    }
  }, [currentUser.id, profileUser.id]);

  const handleToggleFollow = () => {
    if (followingThisUser) unfollow(profileUser.id);
    else follow(profileUser.id);
  };

  const openFollowersModal = () => {
    const users = isOwnProfile ? getFollowersUsers() : SUGGESTED_FRIENDS.slice(0, 3);
    setUserModal({ isOpen: true, title: 'Followers', users });
  };

  const openFollowingModal = () => {
    const users = isOwnProfile ? getFollowingUsers() : SUGGESTED_FRIENDS.slice(2, 5);
    setUserModal({ isOpen: true, title: 'Following', users });
  };

  const handleSave = () => {
    if (!onUpdateUser) return;

    const updatedUser: User = {
      ...currentUser,
      displayName: editData.displayName,
      bio: editData.bio,
      avatar: editData.avatar,
      location: editData.location,
      work: editData.work,
      school: editData.school,
      nickname: editData.nickname,
      religion: editData.religion,
      politicalParty: editData.politicalParty,
      relationshipStatus: editData.relationshipStatus,
    };

    onUpdateUser(updatedUser);

    const registry = localStorage.getItem('nexus_registry');
    if (registry) {
      const users: User[] = JSON.parse(registry);
      const updatedRegistry = users.map(u => u.id === currentUser.id ? updatedUser : u);
      localStorage.setItem('nexus_registry', JSON.stringify(updatedRegistry));
    }

    setIsEditing(false);
  };

  const handleAvatarSeedChange = (seed: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setEditData({ ...editData, avatarSeed: seed, avatar: newAvatar });
  };

  const userPosts = useMemo(() => {
    let posts = [...INITIAL_POSTS];
    if (isOwnProfile) {
      const saved = localStorage.getItem('nexus_posts');
      if (saved) {
        const local = JSON.parse(saved).filter((p: Post) => p.userId === currentUser.id || p.userId === 'me');
        posts = [...local, ...INITIAL_POSTS.filter(p => p.userId === currentUser.id)];
      }
    }

    return posts.map(p => ({
        ...p,
        authorName: profileUser.displayName,
        authorAvatar: profileUser.avatar,
    }));
  }, [profileUser, isOwnProfile, currentUser.id]);

  const mediaPosts = useMemo(() => userPosts.filter(p => p.imageUrl), [userPosts]);

  return (
    <div className="pb-32 min-h-screen">
      <div className="relative h-64 w-full rounded-b-[4rem] overflow-hidden refract-border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-cyan-900/40 animate-aura"></div>
        
        {!isOwnProfile && (
           <Link to="/" className="absolute top-10 left-10 w-12 h-12 glass-aura rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
           </Link>
        )}

        <div className="absolute top-10 right-10 flex gap-4 z-20">
           <button 
             onClick={() => setIsShareModalOpen(true)}
             className="w-12 h-12 glass-aura rounded-2xl flex items-center justify-center text-white hover:bg-white/10 hover:scale-110 transition-all"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
           </button>
        </div>
      </div>

      {shareFeedback && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[700] bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-white/20 animate-in slide-in-from-top-6">
          {shareFeedback}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-10">
        <div className="relative -mt-24 mb-16">
          <div className="flex flex-col md:flex-row items-end gap-10">
            <div className="relative group/avatar">
              <div className="w-48 h-48 rounded-[3.5rem] glass-aura p-2.5 refract-border border-white/20 group-hover:scale-105 transition-all duration-700 shadow-2xl overflow-hidden bg-[#0d1117]">
                <img 
                  src={isEditing ? editData.avatar : profileUser.avatar} 
                  className={`w-full h-full rounded-[3rem] object-cover bg-slate-900 shadow-inner ${isBlocked ? 'grayscale blur-md' : ''}`}
                  alt="avatar" 
                />
              </div>
              {isEditing && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[140px] animate-in slide-in-from-bottom-2 fade-in">
                  <div className="glass-aura rounded-xl px-3 py-1.5 refract-border border-white/10 text-center">
                    <label className="text-[7px] font-black uppercase tracking-widest text-slate-500 block mb-1">Avatar Seed</label>
                    <input 
                      type="text" 
                      value={editData.avatarSeed} 
                      onChange={(e) => handleAvatarSeedChange(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none text-white text-[9px] font-bold text-center placeholder:text-slate-700"
                      placeholder="seed..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                       <input 
                          type="text"
                          value={editData.displayName}
                          onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-4xl font-display font-black text-white tracking-tighter focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                          placeholder="Display Name"
                       />
                       <div className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400 opacity-60">@{profileUser.username}</div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-5xl font-display font-black text-white tracking-tighter mb-2">
                        {profileUser.displayName}
                        {profileUser.nickname && <span className="text-2xl text-slate-500 font-light ml-4">({profileUser.nickname})</span>}
                      </h1>
                      <span className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400">@{profileUser.username}</span>
                    </>
                  )}
                </div>

                <div className="flex gap-4 justify-center md:justify-start">
                   {isOwnProfile ? (
                     <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => setIsEditing(false)} className="px-8 py-4 glass-aura rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all border-white/5">
                              Cancel
                            </button>
                            <button onClick={handleSave} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                              Save Profile
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setIsEditing(true)} className="px-10 py-4 glass-aura rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all refract-border">
                            Edit Profile
                          </button>
                        )}
                     </div>
                   ) : (
                     <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setIsInviteModalOpen(true)}
                          className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-all refract-border"
                          title="Invite friends"
                        >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </button>
                        <FollowButton 
                            isFollowing={followingThisUser} 
                            onClick={handleToggleFollow}
                            size="lg"
                        />
                     </div>
                   )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <textarea 
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl text-slate-300 font-light leading-relaxed italic focus:outline-none focus:ring-1 focus:ring-indigo-500/40 min-h-[100px] resize-none animate-in fade-in"
                    placeholder="Describe yourself..."
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="glass-aura rounded-2xl p-4 refract-border border-white/5">
                      <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Location</label>
                      <input type="text" value={editData.location} onChange={(e) => setEditData({...editData, location: e.target.value})} className="w-full bg-transparent border-none focus:outline-none text-white text-xs font-bold" placeholder="E.g. New York" />
                    </div>
                    <div className="glass-aura rounded-2xl p-4 refract-border border-white/5">
                      <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Job</label>
                      <input type="text" value={editData.work} onChange={(e) => setEditData({...editData, work: e.target.value})} className="w-full bg-transparent border-none focus:outline-none text-white text-xs font-bold" placeholder="E.g. Designer" />
                    </div>
                    <div className="glass-aura rounded-2xl p-4 refract-border border-white/5">
                      <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">School</label>
                      <input type="text" value={editData.school} onChange={(e) => setEditData({...editData, school: e.target.value})} className="w-full bg-transparent border-none focus:outline-none text-white text-xs font-bold" placeholder="E.g. Uni" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <p className="text-xl text-slate-300 font-light leading-relaxed max-w-2xl italic">"{profileUser.bio}"</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-slate-400">
                    {profileUser.location && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-cyan-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{profileUser.location}</span>
                      </div>
                    )}
                    {profileUser.work && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">{profileUser.work}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-12 mt-10 justify-center md:justify-start">
                <div className="text-center md:text-left">
                   <p className="text-3xl font-display font-black text-white leading-none">{profileUser.postsCount || userPosts.length}</p>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Posts</p>
                </div>
                <button onClick={openFollowersModal} className="text-center md:text-left border-l border-white/5 pl-12 group/stat hover:scale-105 transition-transform">
                   <p className="text-4xl font-display font-black text-white leading-none group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                     {displayFollowers.toLocaleString()}
                   </p>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Followers</p>
                </button>
                <button onClick={openFollowingModal} className="text-center md:text-left border-l border-white/5 pl-12 group/stat hover:scale-105 transition-transform">
                   <p className="text-4xl font-display font-black text-white leading-none group-hover:text-indigo-400 transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                     {displayFollowing.toLocaleString()}
                   </p>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Following</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-12 border-b border-white/5 mb-12 sticky top-24 bg-[#02040a]/80 backdrop-blur-xl z-20">
          {(['posts', 'media', 'likes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all relative ${
                activeTab === tab ? 'text-cyan-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           {isBlocked ? (
             <div className="py-40 text-center glass-aura rounded-[4rem] border border-rose-500/10 bg-rose-500/5">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400/60">User Blocked</p>
             </div>
           ) : activeTab === 'posts' ? (
             userPosts.length > 0 ? (
               userPosts.map(post => <PostCard key={post.id} post={post as any} currentUser={currentUser} />)
             ) : (
                <div className="py-32 text-center glass-aura rounded-[3rem] refract-border opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">No posts found.</p>
                </div>
             )
           ) : activeTab === 'media' ? (
             mediaPosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {mediaPosts.map((post) => (
                    <div key={post.id} className="aspect-square rounded-[2.5rem] overflow-hidden group/media relative refract-border border-white/5 shadow-2xl">
                      <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt="" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-[2px]">
                        <div className="flex gap-6">
                           <div className="flex items-center gap-2">
                             <span className="text-rose-400">❤️</span>
                             <span className="text-xs font-black text-white">{post.likes}</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <span className="text-cyan-400">💬</span>
                             <span className="text-xs font-black text-white">{post.commentsList?.length || 0}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
               <div className="py-32 text-center glass-aura rounded-[3rem] refract-border opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">No media found.</p>
               </div>
             )
           ) : (
             <div className="py-32 text-center glass-aura rounded-[3rem] refract-border opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">No liked posts.</p>
             </div>
           )}
        </div>
      </div>

      <ReportModal user={profileUser} isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onReportSuccess={() => {}} />
      <UsersModal isOpen={userModal.isOpen} onClose={() => setUserModal({ ...userModal, isOpen: false })} title={userModal.title} users={userModal.users} />
      
      <InviteModal 
        targetName={profileUser.displayName}
        targetType="user"
        friends={getFollowingUsers()} 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />

      <ShareModal 
        profile={profileUser} 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        onShareSuccess={(msg) => {
          setShareFeedback(msg);
          setTimeout(() => setShareFeedback(null), 3000);
        }} 
      />
    </div>
  );
};

export default ProfilePage;
