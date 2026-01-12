import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Post, User, ReactionType, PostComment } from '../types';
import ShareModal from './ShareModal';
import ReportModal from './ReportModal';
import PostActionModal from './PostActionModal';
import { ALL_MOCK_USERS } from '../constants';
import { useReport } from '../hooks/useReport';
import { useFollow } from '../hooks/useFollow';
import { db, serverTimestamp } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment,
  setDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onReportPost?: (postId: string) => void;
  onUpdatePost?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, onReportPost: onReportPostProp }) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<PostComment[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isRetransmitting, setIsRetransmitting] = useState(false);
  
  const { toggleSavePost, isSaved, reportPost, muteUser, blockUser } = useReport(currentUser.id);
  const { unfollow, isFollowing } = useFollow(currentUser.id);

  const postIsBookmarked = isSaved(post.id);
  const followingAuthor = isFollowing(post.userId);

  // Real-time Comments Listener
  useEffect(() => {
    if (!isCommentsOpen) return;
    const q = query(collection(db, "comments"), where("postId", "==", post.id), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommentsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
    });
    return () => unsubscribe();
  }, [isCommentsOpen, post.id]);

  // Check if user has liked this post
  useEffect(() => {
    const q = query(collection(db, "likes"), where("postId", "==", post.id), where("userId", "==", currentUser.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasLiked(!snapshot.empty);
    });
    return () => unsubscribe();
  }, [post.id, currentUser.id]);

  const safeUpdatePost = async (postId: string, data: any) => {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, data);
    } catch (err: any) {
      if (err.code === 'not-found') {
        console.warn(`Node ${postId} exists in local memory only. Cloud sync skipped.`);
      } else {
        throw err;
      }
    }
  };

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const likeId = `${currentUser.id}_${post.id}`;
      if (hasLiked) {
        await deleteDoc(doc(db, "likes", likeId));
        await safeUpdatePost(post.id, { likesCount: increment(-1) });
      } else {
        await setDoc(doc(db, "likes", likeId), {
          postId: post.id,
          userId: currentUser.id,
          createdAt: serverTimestamp()
        });
        await safeUpdatePost(post.id, { likesCount: increment(1) });
      }
    } catch (e) {
      console.error("Pulse anomaly during like operation:", e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRetransmit = async () => {
    if (isRetransmitting) return;
    setIsRetransmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        userId: currentUser.id,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatar,
        content: post.content, 
        imageUrl: post.imageUrl || "", 
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        shares: 0,
        isRetransmission: true,
        originalAuthor: post.authorName,
        originalPostId: post.id
      });
      await safeUpdatePost(post.id, { shares: increment(1) });
    } catch (e) {
      console.error("Resonance failure during retransmit:", e);
    } finally {
      setIsRetransmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addDoc(collection(db, "comments"), {
        postId: post.id,
        userId: currentUser.id,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatar,
        content: commentText,
        createdAt: serverTimestamp()
      });
      await safeUpdatePost(post.id, { commentsCount: increment(1) });
      setCommentText('');
    } catch (e) {
      console.error("Signal failure during comment:", e);
    }
  };

  const handleReportSuccess = (id: string) => {
    reportPost(id);
    if (onReportPostProp) onReportPostProp(id);
  };

  return (
    <article className="glass-aura rounded-[3rem] p-10 transition-all duration-700 group/card relative overflow-hidden refract-border hover:bg-white/[0.04]">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-10 relative z-20">
        <div 
          className="flex items-center gap-6" 
          role="group" 
          aria-label="Author information"
        >
          <Link 
            to={`/profile/${post.authorName}`} 
            className="relative group/avatar"
            aria-label={`View ${post.authorName}'s profile`}
          >
            <div className="p-1 rounded-[1.8rem] bg-gradient-to-tr from-indigo-500/50 to-cyan-500/50 group-hover/avatar:scale-105 transition-transform">
              <img src={post.authorAvatar} className="w-16 h-16 rounded-[1.6rem] object-cover bg-slate-900 shadow-xl" alt="" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0d1117] rounded-full"></div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h4 
                className="text-xl font-display font-black text-white tracking-tight"
                aria-label={`Post author: ${post.authorName}`}
                role="heading"
                aria-level={4}
              >
                {post.authorName}
              </h4>
              {(post as any).isRetransmission && (
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20" role="status">Resonated</span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-1 block">
              {(post as any).isRetransmission ? `Via ${(post as any).originalAuthor}` : 'Active Node'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setIsActionModalOpen(true)}
          className="w-10 h-10 glass-aura rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all refract-border hover:bg-white/10"
          title="More Options"
          aria-label="Post interaction menu"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>

      <div className="relative z-10">
        <p className="text-xl text-slate-100 font-light leading-relaxed mb-8 selection:bg-indigo-500/30">
          {post.content}
        </p>
        
        {post.imageUrl && (
          <div className="relative rounded-[2.5rem] overflow-hidden mb-10 shadow-2xl group/img">
            <img src={post.imageUrl} className="w-full h-auto object-cover group-hover/img:scale-105 transition-all duration-1000" alt="Visual transmission content" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-white/5 relative z-10">
        <div className="flex items-center justify-between px-2" role="group" aria-label="Transmission interactions">
           <button 
             onClick={() => setIsCommentsOpen(!isCommentsOpen)}
             className={`flex items-center gap-2.5 group transition-colors ${isCommentsOpen ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}
             aria-label={`${post.commentsCount || 0} echoes. Click to expand discussion.`}
             aria-expanded={isCommentsOpen}
           >
              <svg className="w-6 h-6 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{post.commentsCount || 0}</span>
           </button>

           <button 
             onClick={handleRetransmit}
             disabled={isRetransmitting}
             className={`transition-colors group flex items-center gap-2.5 ${isRetransmitting ? 'text-emerald-500/50' : 'text-slate-400 hover:text-emerald-400'}`}
             aria-label={`Retransmit this node. ${post.shares || 0} current retransmissions.`}
           >
              <svg className={`w-6 h-6 stroke-[1.5] transition-all duration-500 ${isRetransmitting ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{post.shares || 0}</span>
           </button>

           <button 
             onClick={handleToggleLike}
             className={`flex items-center gap-2.5 group transition-colors ${hasLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
             aria-label={`${hasLiked ? 'Unlike' : 'Like'} transmission. ${post.likesCount || 0} total resonance.`}
             aria-pressed={hasLiked}
           >
              <svg className={`w-6 h-6 stroke-[1.5] transition-all duration-300 ${hasLiked ? 'fill-rose-500 scale-110' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">{post.likesCount || 0}</span>
           </button>

           <button 
             onClick={() => toggleSavePost(post)}
             className={`transition-colors ${postIsBookmarked ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
             aria-label={`${postIsBookmarked ? 'Remove from' : 'Save to'} neural archive`}
             aria-pressed={postIsBookmarked}
           >
              <svg className={`w-6 h-6 stroke-[1.5] ${postIsBookmarked ? 'fill-indigo-400' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
           </button>

           <button 
             onClick={() => setIsShareModalOpen(true)}
             className="text-slate-400 hover:text-white transition-colors"
             aria-label="Bridge transmission to external networks"
           >
              <svg className="w-6 h-6 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
           </button>
        </div>
      </div>

      {/* Comments Section */}
      {isCommentsOpen && (
        <div className="mt-10 pt-10 border-t border-white/5 animate-in slide-in-from-top-4 duration-500">
           <div 
             className="space-y-8 mb-10 max-h-[300px] overflow-y-auto custom-scrollbar pr-4"
             role="log"
             aria-label="Transmission echoes"
           >
              {commentsList.map(comment => (
                <div key={comment.id} className="flex gap-5 group/comment">
                  <img src={comment.authorAvatar} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10" alt="" />
                  <div className="flex-1">
                    <div className="glass-aura p-5 rounded-[2rem] rounded-tl-none border border-white/5 group-hover/comment:bg-white/[0.04] transition-all">
                       <p className="text-sm text-slate-300 font-light">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {commentsList.length === 0 && (
                <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 py-4 italic">No echoes yet.</p>
              )}
           </div>

           <form onSubmit={handleAddComment} className="flex gap-4">
              <div className="flex-1 glass-aura rounded-2xl px-6 py-3 border border-white/5 focus-within:bg-white/10 transition-all">
                <input 
                  type="text" 
                  placeholder="Add layer..." 
                  className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-light"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  aria-label="Write an echo"
                />
              </div>
              <button type="submit" className="px-8 bg-white text-black rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 active:scale-95 transition-transform">Emit</button>
           </form>
        </div>
      )}

      <ShareModal post={post} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} onShareSuccess={() => {}} />
      
      <ReportModal 
        user={{
          id: post.userId, 
          displayName: post.authorName, 
          avatar: post.authorAvatar, 
          username: post.authorName.toLowerCase().replace(/\s+/g, '_'),
          followers: 0,
          following: 0,
          bio: '',
          email: ''
        }} 
        post={post}
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onReportSuccess={() => handleReportSuccess(post.id)} 
      />

      <PostActionModal 
        post={post}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onUnfollow={unfollow}
        onMute={muteUser}
        onBlock={blockUser}
        onReport={() => setIsReportModalOpen(true)}
        isFollowing={followingAuthor}
      />
    </article>
  );
};

export default PostCard;
