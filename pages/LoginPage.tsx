import React, { useState, useRef } from 'react';
import { User } from '../types';
import { auth, db, storage, googleProvider } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Identity verify failed. Check credentials.';
      case 'auth/email-already-in-use':
        return 'This identity frequency is already synced.';
      case 'auth/weak-password':
        return 'Neural password must be 6+ characters.';
      default:
        return 'A pulse anomaly occurred. Try again.';
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const userDoc = await getDoc(doc(db, "users", fbUser.uid));
      if (userDoc.exists()) {
        onLogin(userDoc.data() as User);
      } else {
        const newUser: User = {
          id: fbUser.uid,
          username: fbUser.email?.split('@')[0] || 'entity_' + Math.floor(Math.random() * 1000),
          displayName: fbUser.displayName || 'Nexus Entity',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          bio: 'Synchronized via Global Network.',
          followers: 0,
          following: 0,
          postsCount: 0
        };
        await setDoc(doc(db, "users", fbUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          verified: false
        });
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        if (userDoc.exists()) {
          onLogin(userDoc.data() as User);
        } else {
          // Recovery logic if document missing
          const fallbackUser: User = {
            id: fbUser.uid,
            username: fbUser.email?.split('@')[0] || 'user',
            displayName: fbUser.displayName || 'Nexus Entity',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            bio: 'Identity recovered.',
            followers: 0,
            following: 0,
            postsCount: 0
          };
          await setDoc(doc(db, "users", fbUser.uid), fallbackUser);
          onLogin(fallbackUser);
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const finalAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`;
        const username = (displayName || 'user').toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);

        await updateProfile(fbUser, { displayName: displayName || 'Nexus Entity', photoURL: finalAvatar });

        const newUser: User = {
          id: fbUser.uid,
          username,
          displayName: displayName || 'Nexus Entity',
          email,
          avatar: finalAvatar,
          bio: 'Identity initialized. Ready for Nexus synchronization.',
          followers: 0,
          following: 0,
          postsCount: 0
        };

        await setDoc(doc(db, "users", fbUser.uid), {
          ...newUser,
          createdAt: serverTimestamp(),
          verified: false
        });
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-cyan-600/5 rounded-full blur-[160px] animate-aura"></div>
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="glass-aura rounded-[3.5rem] p-10 md:p-14 refract-border shadow-2xl transition-all duration-700">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black font-black text-2xl mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.2)] rotate-6">
               NX
            </div>
            <h1 className="text-4xl font-display font-black text-white mb-2 tracking-tight uppercase">
              {isLogin ? 'Nexus Login' : 'Join Nexus'}
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[9px]">
              {isLogin ? 'Activate Neural Link' : 'Initialize Node'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="group animate-in fade-in slide-in-from-top-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Identifier</label>
                <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border border-white/5">
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
                    placeholder="E.g. Ajia Abdulrasak"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Neural Email</label>
              <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border border-white/5">
                <input
                  type="email"
                  required
                  className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
                  placeholder="pulse@nexus.social"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Neural Password</label>
              <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border border-white/5">
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-4.5 px-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] mt-8"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Initiate Sync' : 'Forge Identity'
              )}
            </button>
          </form>

          <div className="mt-8">
             <div className="relative flex items-center justify-center py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative px-4 bg-[#02040a] text-[8px] font-black uppercase tracking-widest text-slate-600">Cross-Platform Sync</span>
             </div>
             <button 
               onClick={handleGoogleLogin}
               disabled={loading}
               className="mt-4 flex items-center justify-center gap-3 w-full py-4 glass-aura rounded-2xl border border-white/5 hover:bg-white/5 transition-all group"
             >
               <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.288 1.288-3.312 2.712-7.392 2.712-6.416 0-11.456-5.2-11.456-11.616s5.04-11.616 11.456-11.616c3.456 0 6.048 1.36 8.232 3.44l2.312-2.312c-2.488-2.432-5.712-4.336-10.544-4.336-8.8 0-16 7.2-16 16s7.2 16 16 16c4.76 0 8.352-1.56 11.168-4.48 2.912-2.912 3.824-7.056 3.824-10.4 0-.816-.064-1.6-.192-2.32h-14.8z"/></svg>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Google Protocol</span>
             </button>
          </div>

          <p className="mt-10 text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
            {isLogin ? "Not yet in the matrix? " : "Identifier exists? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-300 hover:text-white transition-all underline decoration-indigo-500 underline-offset-4"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
