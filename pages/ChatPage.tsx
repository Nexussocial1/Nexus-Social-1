import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';

interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage: string;
  lastUpdated: any;
  type: 'direct' | 'group';
}

const ADMIN_UID = "MKHUPREwtMYaXhAM7KODV4qXyg23";

const ChatPage: React.FC<{ user: User }> = ({ user }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentAuthUid, setCurrentAuthUid] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentAuthUid(fbUser.uid);
        try {
          const token = await fbUser.getIdTokenResult();
          let isElevated = token?.claims.admin === true || fbUser.uid === ADMIN_UID;
          
          if (!isElevated) {
            const userSnap = await getDoc(doc(db, "users", fbUser.uid));
            if (userSnap.exists() && userSnap.data().isAdmin === true) {
              isElevated = true;
            }
          }
          
          setIsAdmin(isElevated);
        } catch (err) {
          console.error("Neural elevation check failed:", err);
        } finally {
          setAdminCheckComplete(true);
        }
      } else {
        setCurrentAuthUid(null);
        setAdminCheckComplete(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!adminCheckComplete || !currentAuthUid) return;

    let q;
    if (isAdmin) {
      q = query(collection(db, "chats"), orderBy("lastUpdated", "desc"));
    } else {
      q = query(
        collection(db, "chats"), 
        where("participants", "array-contains", currentAuthUid),
        orderBy("lastUpdated", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const fetchedRooms = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            participants: data.participants || [],
            participantNames: data.participantNames || [],
            participantAvatars: data.participantAvatars || [],
            lastMessage: data.lastMessage || "",
            lastUpdated: data.lastUpdated,
            type: data.type || 'direct'
          };
        }) as ChatRoom[];
        setRooms(fetchedRooms);
        setLoading(false);
      },
      error: (err) => {
        console.error("Signal stream error:", err);
        if (err.code === 'permission-denied' && isAdmin) {
           console.warn("Elevation mismatch detected.");
           setIsAdmin(false);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isAdmin, adminCheckComplete, currentAuthUid]);

  useEffect(() => {
    if (!activeRoomId) return;

    const q = query(
      collection(db, "chats", activeRoomId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[];
      setMessages(fetchedMessages);
      
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });

    return () => unsubscribe();
  }, [activeRoomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeRoomId || !currentAuthUid) return;

    const content = inputMessage.trim();
    setInputMessage('');

    try {
      await addDoc(collection(db, "chats", activeRoomId, "messages"), {
        senderId: currentAuthUid,
        content,
        timestamp: serverTimestamp(),
        readBy: [currentAuthUid]
      });

      await updateDoc(doc(db, "chats", activeRoomId), {
        lastMessage: content,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error("Transmission error:", err);
    }
  };

  const toggleReadStatus = async (msgId: string, isRead: boolean) => {
    if (!isAdmin || !activeRoomId) return;
    const msgRef = doc(db, "chats", activeRoomId, "messages", msgId);
    try {
      await updateDoc(msgRef, {
        readBy: isRead ? arrayRemove(ADMIN_UID) : arrayUnion(ADMIN_UID)
      });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const getOtherParticipant = (room: ChatRoom) => {
    const activeUid = currentAuthUid || user.id;
    const index = room.participants.indexOf(activeUid);
    const targetIdx = index === -1 ? 0 : (index === 0 ? 1 : 0);
    
    return {
      name: (room.participantNames && room.participantNames[targetIdx]) || "System Node",
      avatar: (room.participantAvatars && room.participantAvatars[targetIdx]) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`
    };
  };

  return (
    <div className="flex h-[calc(100vh-140px)] glass-aura rounded-[4rem] overflow-hidden refract-border border-white/10 relative shadow-2xl">
      <div className="w-80 border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-2xl z-30">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-br from-white/5 to-transparent">
           <div>
             <h2 className="text-2xl font-display font-black text-white tracking-tighter uppercase">Signals</h2>
             <p className="text-[9px] font-black uppercase tracking-[0.5em] text-cyan-400/60 mt-2">{isAdmin ? 'Global Matrix' : 'Neural Hub'}</p>
           </div>
           {isAdmin && (
             <div className="w-8 h-8 bg-rose-500 text-white flex items-center justify-center rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)]" title="Administrator Status">
               <span className="text-[8px] font-black uppercase">ADM</span>
             </div>
           )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
           {!adminCheckComplete || loading ? (
             <div className="p-10 text-center animate-pulse">
               <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Scanning Network...</p>
             </div>
           ) : rooms.map(room => {
             const other = getOtherParticipant(room);
             return (
               <button
                 key={room.id}
                 onClick={() => setActiveRoomId(room.id)}
                 className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-500 relative group ${activeRoomId === room.id ? 'bg-white/10' : 'opacity-60 hover:opacity-100 hover:bg-white/5'}`}
               >
                  {activeRoomId === room.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_15px_cyan]"></div>}
                  <img src={other.avatar} className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform" alt="" />
                  <div className="text-left overflow-hidden flex-1">
                     <p className="text-xs font-black text-white truncate">{other.name}</p>
                     <p className="text-[8px] text-slate-500 font-black truncate mt-0.5">{room.lastMessage}</p>
                  </div>
               </button>
             );
           })}
           {adminCheckComplete && !loading && rooms.length === 0 && (
             <div className="py-20 text-center opacity-20">
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Zero Signals Detected</p>
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-[#02040a]/20">
        {activeRoomId ? (
          <>
            <div className="p-8 border-b border-white/5 flex items-center gap-6 glass-aura z-40 backdrop-blur-3xl">
                <div className="relative">
                  <img src={getOtherParticipant(rooms.find(r => r.id === activeRoomId)!).avatar} className="w-12 h-12 rounded-2xl shadow-xl ring-2 ring-indigo-500/20" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#02040a] rounded-full shadow-[0_0_10px_emerald]"></div>
                </div>
                <div>
                    <h4 className="text-base font-display font-black text-white uppercase tracking-tight">{getOtherParticipant(rooms.find(r => r.id === activeRoomId)!).name}</h4>
                    <p className="text-[8px] font-black uppercase text-cyan-400 mt-1 tracking-widest">Active Resonance Link</p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
               {messages.map(msg => {
                 const isMe = msg.senderId === currentAuthUid;
                 const isRead = msg.readBy && msg.readBy.includes(ADMIN_UID);
                 return (
                   <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="max-w-[70%] relative group">
                        <div className={`px-8 py-5 rounded-[2.5rem] text-sm font-medium tracking-wide shadow-2xl ${isMe ? 'bg-white text-black rounded-br-none' : 'glass-aura text-white border-white/10 rounded-bl-none bg-white/5'}`}>
                          {(msg as any).content}
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={() => toggleReadStatus(msg.id, !!isRead)}
                            className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all border border-white/10 shadow-2xl backdrop-blur-xl ${isRead ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            title={isRead ? "Mark Unread (Admin)" : "Mark Read (Admin)"}
                          >
                            {isRead ? '👁️' : '🔘'}
                          </button>
                        )}
                        <span className={`text-[7px] font-black text-slate-700 uppercase mt-2 block ${isMe ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                   </div>
                 );
               })}
            </div>

            <form onSubmit={handleSendMessage} className="p-8 glass-aura border-t border-white/5 bg-black/40 backdrop-blur-xl">
               <div className="flex gap-4">
                  <div className="flex-1 glass-aura rounded-[2rem] px-8 py-4 refract-border border-white/10 bg-white/5 focus-within:bg-white/10 transition-all">
                    <input 
                      type="text" 
                      placeholder="Emit pulse signal..." 
                      className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700" 
                      value={inputMessage} 
                      onChange={(e) => setInputMessage(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="w-14 h-14 bg-white text-black rounded-[1.5rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  </button>
               </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
             <div className="w-24 h-24 mb-8 opacity-10">
               <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.8em] italic text-cyan-400/40 text-center px-10">Select frequency to synchronize</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
