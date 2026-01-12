import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Story } from '../types';
import { SUGGESTED_FRIENDS, MOCK_STORIES } from '../constants';
import { generateAIImage } from '../geminiService';

interface StoryBarProps {
  currentUser: User;
}

const STORY_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const MAX_TOTAL_STORIES = 20;

const StoryBar: React.FC<StoryBarProps> = ({ currentUser }) => {
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [viewerStories, setViewerStories] = useState<Story[]>([]);
  
  // Creator sequence state
  const [storyDrafts, setStoryDrafts] = useState<{text: string, image: string | null}[]>([]);
  const [currentDraftText, setCurrentDraftText] = useState('');
  const [currentDraftImage, setCurrentDraftImage] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer playback state
  const [progress, setProgress] = useState(0);

  // Load and clean user stories on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_user_stories');
    if (saved) {
      const parsed: Story[] = JSON.parse(saved);
      const active = parsed.filter(s => Date.now() - s.timestamp < STORY_TTL);
      setUserStories(active);
      if (active.length !== parsed.length) {
        localStorage.setItem('nexus_user_stories', JSON.stringify(active));
      }
    }
  }, []);

  const totalPossibleStories = userStories.length + storyDrafts.length + (currentDraftText || currentDraftImage ? 1 : 0);
  const isAtLimit = totalPossibleStories >= MAX_TOTAL_STORIES;

  const handleAddDraft = () => {
    if ((!currentDraftText && !currentDraftImage) || isAtLimit) return;
    setStoryDrafts([...storyDrafts, { text: currentDraftText, image: currentDraftImage }]);
    setCurrentDraftText('');
    setCurrentDraftImage(null);
  };

  const handlePostStory = () => {
    // Add current buffer to drafts if not empty and not at limit
    const finalDrafts = [...storyDrafts];
    if ((currentDraftText || currentDraftImage) && userStories.length + finalDrafts.length < MAX_TOTAL_STORIES) {
      finalDrafts.push({ text: currentDraftText, image: currentDraftImage });
    }

    if (finalDrafts.length === 0) return;

    setIsPosting(true);
    setTimeout(() => {
      const newStories: Story[] = finalDrafts.map((draft, idx) => ({
        id: `s-${Date.now()}-${idx}`,
        userId: currentUser.id,
        userName: currentUser.displayName,
        userAvatar: currentUser.avatar,
        content: draft.text,
        imageUrl: draft.image || undefined,
        timestamp: Date.now() + idx, // offset slightly for sort
        duration: 5000
      }));

      // Ensure we don't exceed 20 total active
      const updated = [...userStories, ...newStories].slice(-MAX_TOTAL_STORIES);
      setUserStories(updated);
      localStorage.setItem('nexus_user_stories', JSON.stringify(updated));
      
      setIsCreatorOpen(false);
      setStoryDrafts([]);
      setCurrentDraftText('');
      setCurrentDraftImage(null);
      setIsPosting(false);
    }, 1200);
  };

  const handleOpenViewer = (stories: Story[], startIndex: number = 0) => {
    // Sort chronologically for playback
    const sorted = [...stories].sort((a, b) => a.timestamp - b.timestamp);
    setViewerStories(sorted);
    setActiveStoryIndex(startIndex);
    setProgress(0);
  };

  const handleCloseViewer = () => {
    setActiveStoryIndex(null);
    setViewerStories([]);
    setProgress(0);
  };

  const handleNextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < viewerStories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    } else {
      handleCloseViewer();
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    let interval: number;
    if (activeStoryIndex !== null) {
      const duration = viewerStories[activeStoryIndex]?.duration || 5000;
      const step = 100 / (duration / 50);
      
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + step;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [activeStoryIndex]);

  const handleGenerateImage = async () => {
    if (!currentDraftText) return;
    setIsGenerating(true);
    const img = await generateAIImage(currentDraftText);
    if (img) setCurrentDraftImage(img);
    setIsGenerating(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentDraftImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate a segmented border style for the user circle
  const segmentedBorderStyle = useMemo(() => {
    const count = userStories.length;
    if (count <= 1) return {};
    
    // Gap reduces as count increases to keep segments visible
    const gap = Math.max(1, 4 - Math.floor(count / 5)); 
    const segment = (360 / count) - gap;
    let gradient = 'conic-gradient(';
    for (let i = 0; i < count; i++) {
      const start = (360 / count) * i;
      const end = start + segment;
      gradient += `#06b6d4 ${start}deg ${end}deg, transparent ${end}deg ${(360 / count) * (i + 1)}deg`;
      if (i < count - 1) gradient += ', ';
    }
    gradient += ')';
    return { background: gradient };
  }, [userStories]);

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth px-2">
      {/* User Story / Create Circle */}
      <div className="flex-shrink-0 group cursor-pointer text-center">
        <div className="relative w-24 h-24 mb-3" onClick={() => userStories.length > 0 ? handleOpenViewer(userStories) : setIsCreatorOpen(true)}>
          <div className="absolute -inset-1 rounded-full opacity-40 group-hover:opacity-80 transition-opacity" style={segmentedBorderStyle}></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-full animate-pulse blur-md opacity-20 pointer-events-none"></div>
          
          <div className={`relative w-full h-full rounded-full glass-aura p-1 refract-border group-hover:scale-110 transition-transform duration-500 overflow-hidden ${userStories.length > 0 ? 'ring-2 ring-white/10 ring-offset-2 ring-offset-[#02040a]' : ''}`}>
            {userStories.length > 0 ? (
              <img src={userStories[userStories.length - 1].imageUrl || currentUser.avatar} className="w-full h-full rounded-full object-cover" alt="my story" />
            ) : (
              <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="me" />
            )}
            
            {userStories.length < MAX_TOTAL_STORIES && userStories.length === 0 && (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-xl shadow-white/20 z-10 scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </div>
            )}
          </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-white transition-colors">
          {userStories.length > 0 ? `${userStories.length}/${MAX_TOTAL_STORIES}` : 'Sync'}
        </span>
      </div>

      {/* Friends Stories */}
      {SUGGESTED_FRIENDS.map((friend) => {
        const friendStories = MOCK_STORIES.filter(s => s.userId === friend.id);
        if (friendStories.length === 0) return null;
        
        return (
          <div key={friend.id} className="flex-shrink-0 group cursor-pointer text-center" onClick={() => handleOpenViewer(friendStories)}>
            <div className="relative w-24 h-24 mb-3">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-all"></div>
              <div className="relative w-full h-full rounded-full glass-aura p-1.5 refract-border border-cyan-500 group-hover:rotate-12 transition-all duration-700 overflow-hidden ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#02040a]">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img 
                    src={friendStories[0].imageUrl} 
                    className="w-full h-full object-cover brightness-[0.7] group-hover:brightness-100 group-hover:scale-125 transition-all duration-1000" 
                    alt="story" 
                  />
                </div>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-cyan-400 transition-colors truncate block w-24">
              {friend.displayName.split(' ')[0]}
            </span>
          </div>
        );
      })}

      {/* Multi-Frame Story Creator */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="glass-aura w-full max-w-lg rounded-[4rem] p-10 refract-border animate-in zoom-in-95 duration-500 shadow-2xl relative">
            <button 
              onClick={() => { setIsCreatorOpen(false); setStoryDrafts([]); }}
              className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-3xl font-display font-black text-white mb-4 tracking-tighter uppercase">Aether Composer</h3>
            <div className="flex justify-between items-center mb-8">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Building sequence: {storyDrafts.length + 1} frames</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${isAtLimit ? 'text-rose-500' : 'text-cyan-400'}`}>
                Capacity: {totalPossibleStories} / {MAX_TOTAL_STORIES}
              </p>
            </div>
            
            <div className="space-y-6">
              <div 
                className="relative aspect-[9/16] w-full max-w-[200px] mx-auto rounded-[2.5rem] glass-aura refract-border border-white/10 overflow-hidden cursor-pointer group/preview"
                onClick={() => !isAtLimit && fileInputRef.current?.click()}
              >
                {currentDraftImage ? (
                  <img src={currentDraftImage} className="w-full h-full object-cover animate-reveal" alt="preview" />
                ) : (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors gap-3 ${isAtLimit ? 'text-rose-900/40' : 'text-slate-500 group-hover/preview:text-white'}`}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{isAtLimit ? 'Full Buffer' : 'Capture Vision'}</span>
                  </div>
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400">Synthesizing...</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={isAtLimit} />
              </div>

              <div className={`glass-aura rounded-2xl p-4 refract-border ${isAtLimit ? 'border-rose-500/20 opacity-50' : 'border-white/5'}`}>
                <textarea
                  placeholder={isAtLimit ? "Neural buffer reached limit." : "Whisper to the Nexus..."}
                  className="w-full bg-transparent border-none focus:outline-none text-white text-base font-light leading-relaxed resize-none h-20 placeholder:text-slate-700"
                  value={currentDraftText}
                  onChange={(e) => setCurrentDraftText(e.target.value)}
                  disabled={isAtLimit}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleGenerateImage}
                  disabled={!currentDraftText || isGenerating || isAtLimit}
                  className="flex-1 glass-aura py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all refract-border disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Synthesis
                </button>
                <button
                  onClick={handleAddDraft}
                  disabled={(!currentDraftText && !currentDraftImage) || isAtLimit}
                  className="flex-1 glass-aura py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all refract-border disabled:opacity-30"
                >
                  + Add Frame
                </button>
              </div>

              <button
                onClick={handlePostStory}
                disabled={(!currentDraftText && !currentDraftImage && storyDrafts.length === 0) || isPosting}
                className="w-full bg-white text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50 flex items-center justify-center"
              >
                {isPosting ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : `Emit ${storyDrafts.length + (currentDraftText || currentDraftImage ? 1 : 0)} Frames`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Story Viewer */}
      {activeStoryIndex !== null && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 md:p-10 animate-in fade-in duration-500 overflow-hidden">
          <div className="relative w-full h-full max-w-[480px] aspect-[9/16] glass-aura md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col group/viewer">
            
            {/* Progress Bars */}
            <div className="absolute top-6 left-6 right-6 flex gap-2 z-50">
              {viewerStories.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-75"
                    style={{ 
                      width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${progress}%` : '0%' 
                    }}
                  ></div>
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-12 left-6 right-6 flex items-center justify-between z-50">
              <div className="flex items-center gap-4">
                <img src={viewerStories[activeStoryIndex].userAvatar} className="w-10 h-10 rounded-xl bg-slate-900 ring-2 ring-white/10" alt="" />
                <div>
                  <h4 className="text-sm font-black text-white tracking-tight">{viewerStories[activeStoryIndex].userName}</h4>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Chronicle</p>
                </div>
              </div>
              <button onClick={handleCloseViewer} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Story Content */}
            <div className="flex-1 relative">
              {viewerStories[activeStoryIndex].imageUrl ? (
                <img src={viewerStories[activeStoryIndex].imageUrl} className="w-full h-full object-cover animate-reveal" key={viewerStories[activeStoryIndex].id} alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-10 text-center">
                   <p className="text-3xl font-light italic text-white leading-relaxed">"{viewerStories[activeStoryIndex].content}"</p>
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>

              {/* Text Caption */}
              {viewerStories[activeStoryIndex].imageUrl && viewerStories[activeStoryIndex].content && (
                <div className="absolute bottom-24 left-10 right-10 z-50">
                  <p className="text-xl font-light text-white leading-relaxed italic drop-shadow-lg text-center">
                    "{viewerStories[activeStoryIndex].content}"
                  </p>
                </div>
              )}
            </div>

            {/* Tap Navigation Targets */}
            <div className="absolute inset-0 flex z-40">
              <div className="flex-1 cursor-pointer" onClick={handlePrevStory}></div>
              <div className="flex-1 cursor-pointer" onClick={handleNextStory}></div>
            </div>

            {/* Interaction Footer */}
            <div className="absolute bottom-8 left-6 right-6 z-50">
              <div className="flex gap-4">
                 <div className="flex-1 glass-aura rounded-2xl px-6 py-4 refract-border border-white/10 bg-white/5">
                    <input type="text" placeholder="Respond to the Aether..." className="bg-transparent border-none focus:outline-none w-full text-sm text-white placeholder:text-slate-600" />
                 </div>
                 <button className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-white hover:bg-rose-500/20 hover:text-rose-400 transition-all border-white/10 group/heart">
                    <svg className="w-6 h-6 group-hover/heart:fill-current transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryBar;
