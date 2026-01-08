
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Post, User } from '../types';
import PostCard from '../components/PostCard';
import { INITIAL_POSTS } from '../constants';

interface PostDetailPageProps {
  currentUser: User;
}

const PostDetailPage: React.FC<PostDetailPageProps> = ({ currentUser }) => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    // Attempt to find in local storage first (user created posts)
    const savedPosts = localStorage.getItem('nexus_posts');
    const localPosts: Post[] = savedPosts ? JSON.parse(savedPosts) : [];
    
    // Combine with initial static posts
    const allPosts = [...localPosts, ...INITIAL_POSTS];
    const found = allPosts.find(p => p.id === postId);
    
    setPost(found || null);
    
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  }, [postId]);

  if (!post) {
    return (
      <div className="py-40 text-center glass-aura rounded-[4rem] border border-rose-500/10 bg-rose-500/5">
        <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-4">Node Not Found</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500/60 mb-8">This transmission has been lost to the void.</p>
        <Link to="/" className="text-[9px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20 px-8 py-4 rounded-2xl hover:bg-cyan-500/10 transition-all">Back to Flow</Link>
      </div>
    );
  }

  return (
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-12 flex items-center gap-6">
        <Link to="/" className="w-12 h-12 glass-aura rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tighter uppercase">Transmission</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500/60">Dedicated Node Context</p>
        </div>
      </div>

      <PostCard 
        post={post} 
        currentUser={currentUser} 
        onUpdatePost={(updated) => setPost(updated)} 
      />
    </div>
  );
};

export default PostDetailPage;
