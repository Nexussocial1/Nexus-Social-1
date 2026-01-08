
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';
import GalleryPage from './pages/GalleryPage';
import PostDetailPage from './pages/PostDetailPage';
import PageDetailPage from './pages/PageDetailPage';
import GroupDetailPage from './pages/GroupDetailPage';
import HubPage from './pages/HubPage';
import SettingsPage from './pages/SettingsPage';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import { User } from './types';

// Simple placeholder for undeveloped routes
const AetherPlaceholder = () => (
  <div className="py-40 text-center glass-aura rounded-[4rem] refract-border animate-aura">
    <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-4">Aether Stream</h2>
    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500/60">Frequencies calibrating...</p>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexus_user');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#02040a] text-slate-200 overflow-x-hidden">
        <Topbar user={user} />

        <div className="relative flex">
          <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 z-[100]">
            <Sidebar user={user} onLogout={handleLogout} />
          </div>

          <main className="flex-1 lg:pl-32 xl:pr-[360px] min-h-screen pt-28">
            <div className="max-w-3xl mx-auto px-4">
              <Routes>
                <Route path="/" element={<HomePage currentUser={user} />} />
                <Route path="/profile/:username" element={<ProfilePage currentUser={user} onUpdateUser={handleUpdateUser} />} />
                <Route path="/profile" element={<Navigate to={`/profile/${user.username}`} replace />} />
                <Route path="/post/:postId" element={<PostDetailPage currentUser={user} />} />
                <Route path="/page/:pageId" element={<PageDetailPage currentUser={user} />} />
                <Route path="/group/:groupId" element={<GroupDetailPage currentUser={user} />} />
                <Route path="/friends" element={<FriendsPage />} />
                <Route path="/groups" element={<HubPage type="groups" currentUser={user} />} />
                <Route path="/pages" element={<HubPage type="pages" currentUser={user} />} />
                <Route path="/settings" element={<SettingsPage currentUser={user} onUpdateUser={handleUpdateUser} />} />
                <Route path="/settings/:tab" element={<SettingsPage currentUser={user} onUpdateUser={handleUpdateUser} />} />
                <Route path="/chat" element={<ChatPage user={user} />} />
                <Route path="/watch" element={<AetherPlaceholder />} />
                <Route path="/memories" element={<GalleryPage currentUser={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>

          <div className="hidden xl:block">
            <RightSidebar />
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
