
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Page, Post, User } from '../types';
import PostCard from '../components/PostCard';
import InviteModal from '../components/InviteModal';
import ShareModal from '../components/ShareModal';
import { useFollow } from '../hooks/useFollow';
import { generateAIImage } from '../geminiService';
import { ALL_MOCK_USERS } from '../constants';

interface PageDetailPageProps {
  currentUser: User;
}

const PageDetailPage: React.FC<PageDetailPageProps> = ({ currentUser }) => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'broadcast' | 'admin'>('broadcast');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [composerText, setComposerText] = useState('');
  const [composerImage, setComposerImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getFollowingUsers } = useFollow(currentUser.id);

  useEffect(() => {
    const savedPages = localStorage.getItem('nexus_pages');
    const pages: Page[] = savedPages ? JSON.parse(savedPages) : [];
    const foundPage = pages.find(p => p.id === pageId);
    
    if (foundPage) {
      setPage(foundPage);
      const savedPosts = localStorage.getItem('nexus_posts');
      const allPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];
      setPosts(allPosts.filter(p => p.pageId === pageId));
    } else {
      navigate('/pages');
    }
  }, [pageId, navigate]);

  const isOwner = page?.ownerId === currentUser.id;
  const isFollowing = page?.followerIds.includes(currentUser.id);

  const handleToggleFollow = () => {
    if (!page) return;
    const updatedPage = {
      ...page,
      followerIds: isFollowing 
        ? page.followerIds.filter(id => id !== currentUser.id)
        : [...page.followerIds, currentUser.id]
    };
    setPage(updatedPage);
    
    const savedPages = localStorage.getItem('nexus_pages');
    const pages: Page[] = savedPages ? JSON.parse(savedPages) : [];
    const newPages = pages.map(p => p.id === page.id ? updatedPage : p);
    localStorage.setItem('nexus_pages', JSON.stringify(newPages));
  };

  const handlePost = () => {
    if (!page || !composerText.trim() || !isOwner) return;

    const newPost: Post = {
      id: `p-page-${Date.now()}`,
      userId: currentUser.id,
      pageId: page.id,
      authorName: page.name,
      authorAvatar: page.avatar,
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

  const handleRemoveFollower = (userId: string) => {
    if (!page || !isOwner) return;
    const updatedPage = {
      ...page,
      followerIds: page.followerIds.filter(id => id !== userId)
    };
    setPage(updatedPage);
    const savedPages = localStorage.getItem('nexus_pages');
    const pages: Page[] = savedPages ? JSON.parse(savedPages) : [];
    localStorage.setItem('nexus_pages', JSON.stringify(pages.map(p => p.id === page.id ? updatedPage : p)));
  };

  if (!page) return null;

  return (
    <div className="pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Page Header */}
      <div className="relative h-64 w-full rounded-b-[4rem] overflow-hidden refract-border border-white/5 mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-indigo-900/40 animate-aura"></div>
        {page.coverImage && <img src={page.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />}
        
        <Link to="/pages" className="absolute top-10 left-10 w-12 h-12 glass-aura rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-all z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-10 relative -mt-32">
        <div className="flex flex-col md:flex-row items-end gap-10 mb-12">
          <div className="w-48 h-48 rounded-full glass-aura p-2 refract-border border-white/20 shadow-2xl overflow-hidden bg-[#0d1117]">
            <img src={page.avatar} className="w-full h-full rounded-full object-cover" alt="" />
          </div>

          <div className="flex-1 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-5xl font-display font-black text-white tracking-tighter mb-2 uppercase">{page.name}</h1>
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400">{page.category} Portal</span>
              </div>

              <div className="flex gap-4">
                <Link to={`/chat?type=page&id=${page.id}`} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all refract-border">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </Link>
                <button onClick={() => setIsInviteModalOpen(true)} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all refract-border"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></button>
                <button 
                  onClick={handleToggleFollow}
                  className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all ${
                    isFollowing 
                      ? 'glass-aura text-cyan-400 ring-1 ring-cyan-500/30' 
                      : 'bg-white text-black hover:scale-105 shadow-xl shadow-white/10'
                  }`}
                >
                  {isFollowing ? 'Resonating' : 'Initiate Sync'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-10 border-b border-white/5 mb-12 sticky top-24 bg-[#02040a]/80 backdrop-blur-xl z-20">
          <button onClick={() => setActiveTab('broadcast')} className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] relative ${activeTab === 'broadcast' ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}>Broadcast {activeTab === 'broadcast' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_10px_cyan]"></div>}</button>
          {isOwner && <button onClick={() => setActiveTab('admin')} className={`py-6 text-[10px] font-black uppercase tracking-[0.4em] relative ${activeTab === 'admin' ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}>Admin Matrix {activeTab === 'admin' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 shadow-[0_0_10px_rose]"></div>}</button>}
        </div>

        {activeTab === 'broadcast' ? (
          <>
            {isOwner && (
              <div className="glass-aura rounded-[3rem] p-10 refract-border border-white/5 mb-16 bg-white/[0.02]">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 mb-8">Portal Broadcast</h3>
                <div className="space-y-6">
                  <textarea value={composerText} onChange={(e) => setComposerText(e.target.value)} placeholder="Synchronize with your audience..." className="w-full bg-transparent border-none focus:outline-none text-white text-xl font-light h-32 resize-none" />
                  {composerImage && <img src={composerImage} className="w-full rounded-[2rem] border border-white/10" alt="" />}
                  <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setComposerImage(reader.result as string); reader.readAsDataURL(file); } }} />
                    <div className="flex-1"></div>
                    <button onClick={handlePost} disabled={!composerText.trim()} className="px-14 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl">Broadcast</button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-16">
              {posts.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />) : <div className="py-40 text-center glass-aura rounded-[4rem] opacity-30 border border-white/5"><p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">No transmissions broadcasted.</p></div>}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 mb-8">Follower Suppression Matrix</h3>
             <div className="grid gap-4">
                {ALL_MOCK_USERS.filter(u => page.followerIds.includes(u.id)).map(follower => (
                  <div key={follower.id} className="p-5 glass-aura rounded-3xl border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <img src={follower.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">@{follower.username}</span>
                     </div>
                     <button onClick={() => handleRemoveFollower(follower.id)} className="px-5 py-2 glass-aura text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500/10 rounded-xl">Sever Signal</button>
                  </div>
                ))}
                {page.followerIds.length === 0 && <p className="text-[10px] text-slate-600 italic uppercase text-center py-10">Static portal. No followers synced.</p>}
             </div>
          </div>
        )}
      </div>

      <InviteModal targetName={page.name} targetType="page" friends={getFollowingUsers()} isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
      <ShareModal profile={{...currentUser, displayName: page.name, avatar: page.avatar, username: page.name.toLowerCase().replace(/\s+/g, '_')}} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShareSuccess={() => {}} />
    </div>
  );
};

export default PageDetailPage;
