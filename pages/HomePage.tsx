
import React, { useState, useEffect, useRef } from 'react';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';
import { Post, User } from '../types';
import { summarizeFeed, generateAIImage } from '../geminiService';
import { useReport } from '../hooks/useReport';
import { useFollow } from '../hooks/useFollow';
import { 
  db, 
  storage, 
  serverTimestamp 
} from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

interface HomePageProps {
  currentUser: User;
}

const HomePage: React.FC<HomePageProps> = ({ currentUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pulseSummary, setPulseSummary] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  
  const { isReported, isIgnored, isMuted, isBlocked, reportPost } = useReport(currentUser.id);
  const { followingIds } = useFollow(currentUser.id);
  
  const [isComposerRendered, setIsComposerRendered] = useState(false);
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const [isComposerClosing, setIsComposerClosing] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerFile, setComposerFile] = useState<File | null>(null);
  const [composerPreview, setComposerPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Feed Listener with Error Handling
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        setPermissionError(false);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        const scoredPosts = fetchedPosts
          .filter(p => !isReported(p.id) && !isMuted(p.userId) && !isBlocked(p.userId))
          .map(p => {
            const createdAt = p.createdAt?.toDate?.() || new Date();
            const recencyHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            const recencyWeight = Math.max(0, 1000 - (recencyHours * 10));
            const followingBonus = followingIds.includes(p.userId) ? 500 : 0;
            const likeScore = (p.likesCount || 0) * 50;
            
            return { ...p, neuralScore: recencyWeight + likeScore + followingBonus };
          })
          .sort((a, b) => b.neuralScore - a.neuralScore);

        setPosts(scoredPosts);
      },
      error: (err) => {
        console.error("Firestore Pulse Interrupted:", err);
        if (err.code === 'permission-denied') {
          setPermissionError(true);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser.id, isReported, isMuted, isBlocked, followingIds]);

  // AI Summary Logic
  useEffect(() => {
    if (posts.length > 0 && !pulseSummary) {
      const triggerSummary = async () => {
        setIsSummarizing(true);
        const summary = await summarizeFeed(posts.slice(0, 5));
        setPulseSummary(summary || null);
        setIsSummarizing(false);
      };
      triggerSummary();
    }
  }, [posts, pulseSummary]);

  const handlePost = async () => {
    if (!composerText.trim() && !composerFile && !composerPreview) return;
    setIsPosting(true);
    
    try {
      let finalImageUrl = "";

      if (composerFile) {
        const imageRef = ref(storage, `posts/${Date.now()}_${composerFile.name}`);
        const uploadResult = await uploadBytes(imageRef, composerFile);
        finalImageUrl = await getDownloadURL(uploadResult.ref);
      } 
      else if (composerPreview?.startsWith('data:')) {
        finalImageUrl = composerPreview; 
      }

      await addDoc(collection(db, "posts"), {
        userId: currentUser.id,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatar,
        content: composerText,
        imageUrl: finalImageUrl,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
        shares: 0
      });

      setComposerText('');
      setComposerFile(null);
      setComposerPreview(null);
      setIsPosting(false);
      closeComposer();
    } catch (error) {
      console.error("Transmission failed:", error);
      setIsPosting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComposerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setComposerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openComposer = () => { setIsComposerRendered(true); setTimeout(() => setIsComposerVisible(true), 10); };
  const closeComposer = () => {
    setIsComposerClosing(true);
    setIsComposerVisible(false);
    setTimeout(() => { setIsComposerRendered(false); setIsComposerClosing(false); }, 400);
  };

  return (
    <div className="space-y-16 pb-32">
      <StoryBar currentUser={currentUser} />
      
      {permissionError && (
        <div className="p-8 glass-aura rounded-3xl border border-rose-500/30 text-rose-400 text-center animate-in fade-in">
          <p className="text-[10px] font-black uppercase tracking-widest">Neural Link Permission Denied</p>
          <p className="text-xs font-light mt-2">Firestore Security Rules are preventing synchronization. Please ensure Auth is active.</p>
        </div>
      )}

      <div className="relative">
        <div className="absolute -inset-10 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse pointer-events-none"></div>
        <div className="glass-aura rounded-[3.5rem] p-12 relative refract-border overflow-hidden group hover:bg-white/[0.05] transition-all duration-700">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)] animate-ping"></div>
            <h3 className="font-display font-black text-cyan-400 tracking-[0.5em] uppercase text-[10px]">Neural Pulse</h3>
            {isSummarizing && <div className="ml-auto w-5 h-5 border-2 border-white/5 border-t-cyan-400 rounded-full animate-spin"></div>}
          </div>
          <div className="text-2xl text-slate-100 font-light leading-relaxed tracking-wide italic max-w-2xl selection:bg-cyan-500/30">
            {pulseSummary || "Gathering frequencies from the Nexus..."}
          </div>
        </div>
      </div>

      <div className="relative">
        <div onClick={openComposer} className="glass-aura rounded-full p-2 pl-8 pr-3 flex items-center gap-6 flex-1 refract-border hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group">
          <div className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] flex-1 group-hover:text-slate-300 transition-colors">Broadcast to Nexus...</div>
          <div className="bg-white text-black px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] group-hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">Emit</div>
        </div>
      </div>

      <div className="space-y-16">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={currentUser} 
              onReportPost={(id) => reportPost(id)} 
            />
          ))
        ) : !permissionError && (
          <div className="py-40 text-center glass-aura rounded-[4rem] opacity-40 refract-border">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic mb-8">The Aether is silent.</p>
            <button onClick={openComposer} className="text-[9px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20 px-8 py-4 rounded-2xl hover:bg-cyan-500/10 transition-all">Initiate Transmission</button>
          </div>
        )}
      </div>

      {isComposerRendered && (
        <div className={`fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl transition-opacity duration-500 ${isComposerVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`glass-aura w-full max-w-2xl rounded-[4rem] p-12 refract-border shadow-2xl relative overflow-hidden transition-all duration-500 ${isComposerVisible ? 'translate-y-0 scale-100' : 'translate-y-12 scale-90 blur-xl'} ${isComposerClosing ? 'animate-composer-exit' : ''}`}>
             <button onClick={closeComposer} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center glass-aura rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all z-20">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <h3 className="text-3xl font-display font-black text-white tracking-tighter uppercase mb-6">Forge Node</h3>
             <div className="space-y-8">
                <div className="glass-aura rounded-[2.5rem] p-8 bg-white/[0.02] border border-white/10">
                  <textarea placeholder="Compose resonance..." className="w-full bg-transparent border-none focus:outline-none text-white text-xl font-light h-32 resize-none" value={composerText} onChange={(e) => setComposerText(e.target.value)} />
                  {composerPreview && <img src={composerPreview} className="w-full rounded-[2rem] mt-4 animate-reveal" alt="preview" />}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <button onClick={async () => { if (!composerText.trim()) return; setIsGenerating(true); const img = await generateAIImage(composerText); if (img) setComposerPreview(img); setIsGenerating(false); }} className="px-8 py-4 glass-aura rounded-2xl text-cyan-400 text-[9px] font-black uppercase tracking-widest disabled:opacity-30" disabled={isGenerating}>
                    {isGenerating ? "Synthesizing..." : "AI Vision"}
                  </button>
                  <div className="flex-1"></div>
                  <button onClick={handlePost} disabled={isPosting || (!composerText.trim() && !composerPreview)} className="px-14 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em]">
                    {isPosting ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : "Emit"}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
