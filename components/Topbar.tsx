import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Group, Page, Notification } from '../types';
import { ALL_MOCK_USERS } from '../constants';
import { useNotifications } from '../hooks/useNotifications';
import NotificationActionModal from './NotificationActionModal';

interface TopbarProps {
  user: User;
}

interface CombinedResult {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  type: 'user' | 'group' | 'page';
  link: string;
}

const NotificationItem: React.FC<{ 
  notification: Notification; 
  onMarkRead: (id: string) => void;
  onNavigate: (link?: string) => void;
  onOptionsClick: (e: React.MouseEvent, notification: Notification) => void;
}> = ({ notification, onMarkRead, onNavigate, onOptionsClick }) => {
  const getIcon = () => {
    switch(notification.type) {
      case 'like': return <span className="text-rose-500">❤️</span>;
      case 'comment': return <span className="text-cyan-400">💬</span>;
      case 'follow': return <span className="text-indigo-400">✨</span>;
      case 'system': return <span className="text-emerald-400">⚡</span>;
      case 'invite': return <span className="text-blue-400">👋</span>;
      default: return <span className="text-white">🔔</span>;
    }
  };

  return (
    <div 
      onClick={() => {
        onMarkRead(notification.id);
        if (notification.link) onNavigate(notification.link);
      }}
      className={`p-4 rounded-[2rem] transition-all duration-300 cursor-pointer flex gap-4 items-start border border-transparent group ${
        notification.isRead 
          ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-white/5' 
          : 'bg-white/[0.04] border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)] hover:bg-white/[0.08]'
      }`}
    >
      <div className="relative shrink-0">
        <img src={notification.actorAvatar} className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10" alt="" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center text-[10px] ring-1 ring-white/10">
          {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white leading-relaxed">
          <span className="font-black">{notification.actorName}</span>{' '}
          <span className="text-slate-300 font-light">{notification.message}</span>
        </p>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-2 block">{notification.timestamp}</span>
      </div>
      
      <button 
        onClick={(e) => onOptionsClick(e, notification)}
        className="p-2 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] shrink-0 mt-2"></div>
      )}
    </div>
  );
};

const Topbar: React.FC<TopbarProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CombinedResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedNotificationForAction, setSelectedNotificationForAction] = useState<Notification | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, turnOffNotifications } = useNotifications(user.id);

  useEffect(() => {
    const checkLockout = () => {
      const lockout = localStorage.getItem('nexus_circuit_lockout');
      setIsOnline(!lockout || parseInt(lockout) < Date.now());
    };
    const interval = setInterval(checkLockout, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const results: CombinedResult[] = [];

      // People
      ALL_MOCK_USERS.forEach(u => {
        if (u.displayName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query)) {
          results.push({
            id: u.id,
            name: u.displayName,
            subtitle: `@${u.username}`,
            avatar: u.avatar,
            type: 'user',
            link: `/profile/${u.username}`
          });
        }
      });

      // Clusters (Groups)
      const savedGroups = localStorage.getItem('nexus_groups');
      const groups: Group[] = savedGroups ? JSON.parse(savedGroups) : [];
      groups.forEach(g => {
        if (g.name.toLowerCase().includes(query)) {
          results.push({
            id: g.id,
            name: g.name,
            subtitle: `${g.memberIds.length} Members`,
            avatar: g.avatar,
            type: 'group',
            link: `/group/${g.id}`
          });
        }
      });

      // Portals (Pages)
      const savedPages = localStorage.getItem('nexus_pages');
      const pages: Page[] = savedPages ? JSON.parse(savedPages) : [];
      pages.forEach(p => {
        if (p.name.toLowerCase().includes(query)) {
          results.push({
            id: p.id,
            name: p.name,
            subtitle: p.category,
            avatar: p.avatar,
            type: 'page',
            link: `/page/${p.id}`
          });
        }
      });

      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categorizedResults = {
    user: searchResults.filter(r => r.type === 'user'),
    group: searchResults.filter(r => r.type === 'group'),
    page: searchResults.filter(r => r.type === 'page'),
  };

  const handleResultClick = (link: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    navigate(link);
  };

  const handleOptionsClick = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    setSelectedNotificationForAction(notification);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-3xl z-[90] transition-opacity duration-700 pointer-events-none ${isSearchFocused || isNotificationsOpen || isProfileMenuOpen ? 'opacity-100' : 'opacity-0'}`}></div>

      <header className="fixed top-6 left-0 right-0 z-[100] px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="glass-aura w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl group hover:scale-110 transition-all duration-500 refract-border">
            <div className="w-5 h-5 bg-white rounded-md group-hover:rotate-12 transition-transform"></div>
          </Link>
          <div className="hidden lg:flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-500">Neural Pulse</span>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-1000 ${isOnline ? 'bg-cyan-400 text-cyan-400 animate-pulse' : 'bg-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]'}`}></div>
               <span className={`text-[8px] font-black uppercase tracking-widest ${isOnline ? 'text-cyan-400/60' : 'text-rose-500/60'}`}>{isOnline ? 'Active' : 'Syncing'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative" ref={searchRef}>
          <div className={`glass-aura rounded-full transition-all duration-500 flex items-center px-6 py-3 refract-border ${isSearchFocused ? 'bg-white/10 ring-2 ring-indigo-500/20 scale-105' : 'hover:bg-white/5'}`}>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search collective nodes..." 
              className="bg-transparent border-none focus:outline-none flex-1 ml-4 text-sm font-medium placeholder:text-slate-500 text-white selection:bg-cyan-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
          </div>

          {isSearchFocused && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-4 glass-aura rounded-[2rem] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-500 z-[110] refract-border shadow-2xl bg-[#050505]/95">
              <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                {searchResults.length === 0 ? (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">Sector Static.</p>
                  </div>
                ) : (
                  <>
                    {categorizedResults.user.length > 0 && (
                      <section>
                        <h5 className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-400 mb-4 px-2">People</h5>
                        <div className="space-y-1">
                          {categorizedResults.user.map(r => (
                            <button key={r.id} onClick={() => handleResultClick(r.link)} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all text-left group">
                              <img src={r.avatar} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform" alt="" />
                              <div><p className="text-sm font-bold text-white leading-none group-hover:text-cyan-400 transition-colors">{r.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{r.subtitle}</p></div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                    {categorizedResults.group.length > 0 && (
                      <section>
                        <h5 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4 px-2 border-t border-white/5 pt-6">Clusters</h5>
                        <div className="space-y-1">
                          {categorizedResults.group.map(r => (
                            <button key={r.id} onClick={() => handleResultClick(r.link)} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all text-left group">
                              <div className="w-10 h-10 rounded-xl overflow-hidden glass-aura p-1 group-hover:ring-1 group-hover:ring-indigo-500/50 transition-all"><img src={r.avatar} className="w-full h-full rounded-lg object-cover" alt="" /></div>
                              <div><p className="text-sm font-bold text-white leading-none group-hover:text-indigo-400 transition-colors">{r.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{r.subtitle}</p></div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                    {categorizedResults.page.length > 0 && (
                      <section>
                        <h5 className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-4 px-2 border-t border-white/5 pt-6">Portals</h5>
                        <div className="space-y-1">
                          {categorizedResults.page.map(r => (
                            <button key={r.id} onClick={() => handleResultClick(r.link)} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all text-left group">
                              <img src={r.avatar} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform" alt="" />
                              <div><p className="text-sm font-bold text-white leading-none group-hover:text-emerald-400 transition-colors">{r.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{r.subtitle}</p></div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifyRef}>
            <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileMenuOpen(false); }} className={`glass-aura w-14 h-14 rounded-2xl flex items-center justify-center transition-all refract-border relative ${isNotificationsOpen ? 'bg-white text-black scale-110 shadow-2xl' : 'text-slate-300 hover:text-white'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <div className="absolute top-3 right-3 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-black text-black animate-pulse border-2 border-black">{unreadCount}</div>}
            </button>
            {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-4 w-96 !bg-[#050505] rounded-[3rem] p-6 shadow-2xl z-[300] border-2 border-white/20 animate-in fade-in slide-in-from-top-6 duration-300 origin-top-right overflow-hidden ring-1 ring-inset ring-white/10">
                <div className="px-4 py-2 border-b border-white/5 mb-4 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Echo Buffer</span>
                  <button onClick={markAllAsRead} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Clear</button>
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                  <div className="px-4 mb-2"><h6 className="text-[8px] font-black uppercase tracking-widest text-slate-600">Recent</h6></div>
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <NotificationItem 
                        key={n.id} 
                        notification={n} 
                        onMarkRead={markAsRead} 
                        onOptionsClick={handleOptionsClick}
                        onNavigate={(link) => { if (link) navigate(link); setIsNotificationsOpen(false); }} 
                      />
                    ))
                  ) : (
                    <p className="text-center py-10 text-[10px] uppercase font-black tracking-widest text-slate-700">Zero resonance</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Link to="/chat" className="glass-aura w-14 h-14 rounded-2xl flex items-center justify-center text-slate-300 hover:text-white transition-all refract-border relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_indigo]"></div>
          </Link>

          <div className="relative" ref={profileRef}>
            <button onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotificationsOpen(false); }} className="glass-aura p-1.5 pr-5 rounded-2xl flex items-center gap-3 hover:bg-white/5 transition-all refract-border group">
              <img src={user.avatar} className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-500 transition-all" alt="" />
              <div className="hidden md:block text-left"><p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">{user.displayName.split(' ')[0]}</p><p className="text-[8px] font-bold text-cyan-400 uppercase mt-1">Lvl 42 Node</p></div>
            </button>
            {isProfileMenuOpen && (
              <div className="absolute top-full right-0 mt-4 w-64 !bg-[#050505] rounded-[2.5rem] p-4 shadow-2xl z-[300] border-2 border-white/20 animate-in fade-in slide-in-from-top-4 duration-300 origin-top-right ring-1 ring-inset ring-white/10">
                <div className="space-y-1">
                  <Link to={`/profile/${user.username}`} onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group/p"><div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/p:bg-indigo-500 group-hover/p:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover/p:text-white">Profile Node</span></Link>
                  <Link to="/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group/p"><div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover/p:bg-cyan-500 group-hover/p:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover/p:text-white">Settings</span></Link>
                  <div className="h-[1px] bg-white/5 my-2"></div>
                  <button onClick={() => window.location.reload()} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-500/10 transition-all group/p text-left"><div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover/p:bg-rose-500 group-hover/p:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/p:text-rose-400">Logout Signal</span></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationActionModal 
        notification={selectedNotificationForAction} 
        isOpen={!!selectedNotificationForAction} 
        onClose={() => setSelectedNotificationForAction(null)}
        onDelete={deleteNotification}
        onMute={turnOffNotifications}
      />
    </>
  );
};

export default Topbar;
