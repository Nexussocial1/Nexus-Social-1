import React, { useState, useEffect, useMemo } from 'react';
import { Post, User } from '../types';
import { getGlobalEchoes } from '../geminiService';
import { INITIAL_POSTS } from '../constants';
import PostCard from '../components/PostCard';

interface GalleryPageProps {
  currentUser: User;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ currentUser }) => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const fetchAllMedia = async () => {
      setLoading(true);
      const savedPostsStr = localStorage.getItem('nexus_posts');
      const localPosts: Post[] = savedPostsStr ? JSON.parse(savedPostsStr) : [];
      const globalEchoes = await getGlobalEchoes();
      
      const combined = [...localPosts, ...INITIAL_POSTS, ...globalEchoes]
        .filter((post, index, self) => 
          index === self.findIndex((p) => p.id === post.id) && post.imageUrl
        )
        .sort((a, b) => {
           if (a.timestamp === 'Global Echo' && b.timestamp !== 'Global Echo') return 1;
           if (a.timestamp !== 'Global Echo' && b.timestamp === 'Global Echo') return -1;
           return 0;
        });

      setAllPosts(combined);
      setLoading(false);
    };

    fetchAllMedia();
  }, []);

  const imageGrid = useMemo(() => {
    return allPosts.map((post) => (
      <div 
        key={post.id} 
        onClick={() => setSelectedPost(post)}
        className="break-inside-avoid mb-6 rounded-[3rem] overflow-hidden glass-aura refract-border border-white/5 cursor-pointer group/item relative shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <img 
          src={post.imageUrl} 
          className="w-full h-auto object-cover group-hover:scale-105 transition-all duration-1000" 
          alt={post.content} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
           <div className="flex items-center gap-3 mb-2">
              <img src={post.authorAvatar} className="w-8 h-8 rounded-xl object-cover ring-2 ring-white/20" alt="" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{post.authorName}</span>
           </div>
           <p className="text-[9px] text-slate-300 font-medium line-clamp-2 italic">"{post.content}"</p>
        </div>
      </div>
    ));
  }, [allPosts]);

  return (
    <div className="pb-40">
      <div className="mb-16">
        <h2 className="text-5xl font-display font-black text-white tracking-tighter mb-4 uppercase">Neural Archive</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">Global Visual Frequency</p>
      </div>

      {loading ? (
        <div className="py-40 text-center">
           <div className="w-12 h-12 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">Reconstructing patterns...</p>
        </div>
      ) : allPosts.length > 0 ? (
        <div className="columns-1 md:columns-2 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          {imageGrid}
        </div>
      ) : (
        <div className="py-40 text-center glass-aura rounded-[4rem] opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">The archive is silent.</p>
        </div>
      )}

      {/* Post Quick View Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="w-full max-w-2xl animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-end mb-6">
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="w-12 h-12 glass-aura rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all"
                >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             <PostCard post={selectedPost} currentUser={currentUser} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
