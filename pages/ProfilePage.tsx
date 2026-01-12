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
import { storage, db } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

interface ProfilePageProps {
  currentUser: User;
  onUpdateUser?: (updatedUser: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateUser }) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    location: currentUser.location || '',
    work: currentUser.work || '',
    school: currentUser.school || '',
  });

  const [profileUser, setProfileUser] = useState<User | null>(null);

  useEffect(() => {
    if (!username) return;
    
    // Listen for live updates to the profile being viewed
    const targetUserId = ALL_MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase())?.id || currentUser.id;
    const unsubscribe = onSnapshot(doc(db, "users", targetUserId), (snap) => {
      if (snap.exists()) {
        setProfileUser(snap.data() as User);
      } else {
        // Fallback for mock users or first-time sync
        const found = ALL_MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
        setProfileUser(found || currentUser);
      }
    });

    return () => unsubscribe();
  }, [username, currentUser]);

  const isOwnProfile = profileUser?.id === currentUser.id;
  const followingThisUser = profileUser ? isFollowing(profileUser.id) : false;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile) return;

    setIsUploading(true);
    try {
      const avatarRef = ref(storage, `avatars/${currentUser.id}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);
      
      await updateDoc(doc(db, "users", currentUser.id), { avatar: url });
      if (onUpdateUser) onUpdateUser({ ...currentUser, avatar: url });
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!onUpdateUser) return;

    const updatedData = {
      displayName: editData.displayName,
      bio: editData.bio,
      location: editData.location,
      work: editData.work,
      school: editData.school,
    };

    try {
      await updateDoc(doc(db, "users", currentUser.id), updatedData);
      onUpdateUser({ ...currentUser, ...updatedData });
      setIsEditing(false);
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  };

  if (!profileUser) return null;

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

      <div className="max-w-4xl mx-auto px-10">
        <div className="relative -mt-24 mb-16">
          <div className="flex flex-col md:flex-row items-end gap-10">
            <div className="relative group/avatar">
              <div 
                className="w-48 h-48 rounded-[3.5rem] glass-aura p-2.5 refract-border border-white/20 group-hover:scale-105 transition-all duration-700 shadow-2xl overflow-hidden bg-[#0d1117] cursor-pointer"
                onClick={() => isOwnProfile && fileInputRef.current?.click()}
              >
                <img 
                  src={profileUser.avatar} 
                  className={`w-full h-full rounded-[3rem] object-cover bg-slate-900 shadow-inner ${isUploading ? 'blur-md' : ''}`}
                  alt="avatar" 
                />
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth={2}/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/></svg>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
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
                        >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </button>
                        <FollowButton 
                            isFollowing={followingThisUser} 
                            onClick={() => (followingThisUser ? unfollow(profileUser.id) : follow(profileUser.id))}
                            size="lg"
                        />
                     </div>
                   )}
                </div>
              </div>

              <div className="space-y-8">
                {isEditing ? (
                  <textarea 
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl text-slate-300 font-light leading-relaxed italic focus:outline-none focus:ring-1 focus:ring-indigo-500/40 min-h-[100px] resize-none"
                    placeholder="Describe yourself..."
                  />
                ) : (
                  <p className="text-xl text-slate-300 font-light leading-relaxed max-w-2xl italic">"{profileUser.bio}"</p>
                )}
              </div>

              <div className="flex gap-12 mt-10 justify-center md:justify-start">
                <div>
                   <p className="text-3xl font-display font-black text-white leading-none">{profileUser.postsCount || 0}</p>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Posts</p>
                </div>
                <div className="border-l border-white/5 pl-12">
                   <p className="text-4xl font-display font-black text-white leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                     {(isOwnProfile ? followerCount : profileUser.followers).toLocaleString()}
                   </p>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Followers</p>
                </div>
                <div className="border-l border-white/5 pl-12">
                   <p className="text-4xl font-display font-black text-white leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                     {(isOwnProfile ? followingCount : profileUser.following).toLocaleString()}
                   </p>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mt-2">Following</p>
                </div>
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
           {activeTab === 'posts' && (
             <div className="py-32 text-center glass-aura rounded-[3rem] refract-border opacity-30">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">No public transmissions found.</p>
             </div>
           )}
        </div>
      </div>
      <ReportModal user={profileUser} isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onReportSuccess={() => {}} />
    </div>
  );
};

export default ProfilePage;
