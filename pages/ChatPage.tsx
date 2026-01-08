
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, Conversation, Message, Group, Page } from '../types';
import { ALL_MOCK_USERS, SUGGESTED_FRIENDS } from '../constants';
import { generateAIChatResponse } from '../geminiService';
import { useReport } from '../hooks/useReport';

const NEXUS_AI_USER: User = {
  id: 'nexus-ai',
  username: 'nexus_ai',
  displayName: 'Nexus AI',
  email: 'ai@nexus.social',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NexusAI',
  bio: 'Social Resonance Guide.',
  followers: 9999,
  following: 0,
};

const ChatPage: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetId = searchParams.get('id');
  const targetType = searchParams.get('type') as 'group' | 'page' | null;

  const { blockUser, isBlocked } = useReport(user.id);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [attachedFile, setAttachedFile] = useState<{ url: string, type: 'image' | 'video' | 'audio' | 'video-note' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedGroups = localStorage.getItem('nexus_groups');
    const groups: Group[] = savedGroups ? JSON.parse(savedGroups) : [];
    const savedPages = localStorage.getItem('nexus_pages');
    const pages: Page[] = savedPages ? JSON.parse(savedPages) : [];

    const initialConversations: Conversation[] = [
      { id: '1', type: 'direct', participant: NEXUS_AI_USER, lastMessage: 'Ask me anything...', unreadCount: 1 },
      { id: '2', type: 'direct', participant: SUGGESTED_FRIENDS[0], lastMessage: 'Hello!', unreadCount: 0 },
    ];

    if (targetId && targetType) {
      const entity = targetType === 'group' 
        ? groups.find(g => g.id === targetId) 
        : pages.find(p => p.id === targetId);
      
      if (entity && !initialConversations.find(c => c.id === entity.id)) {
        initialConversations.unshift({
          id: entity.id,
          type: targetType,
          participant: entity as any,
          lastMessage: 'Starting sync...',
          unreadCount: 0
        });
      }
      setActiveConversationId(entity?.id || '1');
    } else {
      setActiveConversationId('1');
    }

    setConversations(initialConversations);
    setMessages({
      '1': [{ id: 'm0', senderId: 'nexus-ai', text: 'How can I help you today?', timestamp: new Date() }],
      '2': [{ id: 'm1', senderId: 'u4', text: 'Ready for the meeting?', timestamp: new Date() }]
    });
  }, [targetId, targetType]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, activeConversationId]);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAttachedFile({ url: URL.createObjectURL(audioBlob), type: 'audio' });
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) { console.error(err); }
  };

  const startVideoNoteRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        setAttachedFile({ url: URL.createObjectURL(videoBlob), type: 'video-note' });
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecordingVideo(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecordingAudio(false);
    setIsRecordingVideo(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !attachedFile) || !activeConversationId) return;

    const userMsg: Message = { 
      id: `m-${Date.now()}`, 
      senderId: user.id, 
      text: inputMessage, 
      mediaUrl: attachedFile?.url,
      mediaType: attachedFile?.type,
      timestamp: new Date() 
    };

    setMessages(prev => ({ ...prev, [activeConversationId]: [...(prev[activeConversationId] || []), userMsg] }));
    setInputMessage('');
    setAttachedFile(null);

    if (activeConversationId === '1') {
      setIsTyping(true);
      const reply = await generateAIChatResponse([{ role: 'user', parts: [{ text: inputMessage }] }]);
      const aiMsg: Message = { id: `ai-${Date.now()}`, senderId: 'nexus-ai', text: reply, timestamp: new Date() };
      setMessages(prev => ({ ...prev, [activeConversationId]: [...(prev[activeConversationId] || []), aiMsg] }));
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, preferredType?: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const type = preferredType || (file.type.startsWith('video') ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => setAttachedFile({ url: reader.result as string, type });
      reader.readAsDataURL(file);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const isTargetBlocked = activeConv && activeConv.type === 'direct' && isBlocked(activeConv.participant.id);

  return (
    <div className="flex h-[calc(100vh-140px)] glass-aura rounded-[4rem] overflow-hidden refract-border border-white/10 relative shadow-2xl">
      <div className="w-80 border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-2xl z-30">
        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
           <h2 className="text-2xl font-display font-black text-white tracking-tighter uppercase">Chats</h2>
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-cyan-400/60 mt-2">Neural Hub</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
           {conversations.map(conv => (
             <button
               key={conv.id}
               onClick={() => setActiveConversationId(conv.id)}
               className={`w-full flex items-center gap-5 p-4 rounded-3xl transition-all duration-500 relative group ${activeConversationId === conv.id ? 'bg-white/10' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}
             >
                {activeConversationId === conv.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_15px_cyan]"></div>}
                <img src={(conv.participant as any).avatar} className={`w-12 h-12 rounded-2xl object-cover bg-slate-900 group-hover:scale-110 transition-transform ${conv.type === 'page' ? 'rounded-full' : ''}`} alt="" />
                <div className="text-left overflow-hidden">
                   <p className="text-xs font-black text-white truncate">{(conv.participant as any).name || (conv.participant as any).displayName}</p>
                   <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1 truncate">{conv.lastMessage}</p>
                </div>
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/30 rounded-full blur-[120px] animate-aura"></div>
        </div>

        {activeConv ? (
          <>
            <div className="p-8 border-b border-white/5 flex items-center justify-between px-10 glass-aura z-40">
               <div className="flex items-center gap-6">
                  <div className="relative">
                    <img src={(activeConv.participant as any).avatar} className={`w-12 h-12 rounded-2xl ring-2 ring-indigo-500/30 shadow-2xl ${activeConv.type === 'page' ? 'rounded-full' : ''}`} alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#02040a] rounded-full shadow-[0_0_10px_emerald]"></div>
                  </div>
                  <div>
                    <h4 className="text-base font-display font-black text-white tracking-tight uppercase">{(activeConv.participant as any).name || (activeConv.participant as any).displayName}</h4>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-400/80 mt-1">Status: Operational</p>
                  </div>
               </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar z-20">
               {isTargetBlocked ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/30"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></div>
                    <p className="text-xl font-display font-black text-white uppercase">Signal Severed</p>
                    <button onClick={() => blockUser(activeConv.participant.id)} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase">Restore Link</button>
                 </div>
               ) : (
                 messages[activeConversationId!]?.map(msg => (
                   <div key={msg.id} className={`flex flex-col group/msg ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] space-y-3 ${msg.senderId === user.id ? 'flex flex-col items-end' : ''}`}>
                        {msg.mediaUrl && (
                          <div className={`overflow-hidden shadow-2xl relative transition-all duration-700 hover:scale-[1.02] ${msg.mediaType === 'video-note' ? 'w-64 h-64 rounded-full refract-border border-4 border-indigo-500/40' : 'rounded-[3rem] border border-white/10'}`}>
                            {msg.mediaType === 'video' || msg.mediaType === 'video-note' ? (
                              <video src={msg.mediaUrl} controls={msg.mediaType !== 'video-note'} autoPlay={msg.mediaType === 'video-note'} loop={msg.mediaType === 'video-note'} muted={msg.mediaType === 'video-note'} className="w-full h-full object-cover" />
                            ) : msg.mediaType === 'audio' ? (
                              <div className="p-6 glass-aura rounded-[2.5rem] border border-cyan-500/40 min-w-[280px] flex items-center gap-6 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                                 <div className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center text-black shadow-[0_0_20px_cyan] animate-pulse">
                                   <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-end gap-1 h-8">
                                       {[...Array(12)].map((_, i) => <div key={i} className="flex-1 bg-cyan-400 rounded-full animate-aura" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>)}
                                    </div>
                                    <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mt-2 block">Voice Note Protocol</span>
                                 </div>
                              </div>
                            ) : (
                              <img src={msg.mediaUrl} className="w-full h-auto max-h-[450px] object-cover" alt="" />
                            )}
                          </div>
                        )}
                        {msg.text && (
                          <div className={`px-8 py-5 rounded-[2.5rem] text-sm font-medium tracking-wide shadow-2xl relative ${msg.senderId === user.id ? 'bg-white text-black rounded-br-none' : 'glass-aura text-slate-100 rounded-bl-none border-white/10'}`}>
                            {msg.text}
                          </div>
                        )}
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-10 bg-[#02040a]/40 backdrop-blur-xl">
               {attachedFile && (
                 <div className="mb-8 animate-in slide-in-from-bottom-4">
                    <div className={`relative ${attachedFile.type === 'video-note' ? 'w-48 h-48 rounded-full' : 'w-32 h-32 rounded-3xl'} overflow-hidden ring-4 ring-cyan-500/50 shadow-2xl`}>
                       {attachedFile.type === 'audio' ? <div className="w-full h-full bg-slate-900 flex items-center justify-center text-cyan-400"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div> : <img src={attachedFile.url} className="w-full h-full object-cover" alt="" />}
                       <button onClick={() => setAttachedFile(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-rose-500 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                 </div>
               )}

               <div className="flex items-center gap-4">
                  {!isRecordingAudio && !isRecordingVideo ? (
                    <>
                      <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                      <button onClick={() => videoInputRef.current?.click()} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-purple-400 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                      <button onClick={startAudioRecording} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-400 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>
                      <button onClick={startVideoNoteRecording} className="w-14 h-14 glass-aura rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-400 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} />
                      <div className="flex-1 glass-aura rounded-[2.5rem] px-8 py-5 refract-border border-white/10">
                        <form onSubmit={handleSendMessage} className="w-full flex items-center">
                          <input type="text" placeholder="Whisper to the Nexus..." className="bg-transparent border-none focus:outline-none w-full text-base text-white placeholder:text-slate-700" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
                          <button type="submit" className="text-cyan-400 hover:scale-125 transition-transform"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 glass-aura rounded-[2.5rem] px-8 py-5 border-rose-500/30 flex items-center justify-between">
                       <div className="flex items-center gap-4"><div className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></div><span className="text-sm font-black text-rose-500 uppercase">Synchronizing Media...</span></div>
                       <span className="text-xl font-display font-black text-white">{recordingTime}s</span>
                       <button onClick={stopRecording} className="px-10 py-3 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase">Finish Sync</button>
                    </div>
                  )}
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 animate-in fade-in">
             <p className="text-[10px] font-black uppercase tracking-[0.8em] italic text-cyan-400/40">Select frequency to synchronize</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
