
import React, { useState } from 'react';
import { User } from '../types';
import { auth, db } from '../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'The email or password you entered is incorrect. Please check your credentials and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up instead.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already associated with an account. Try logging in.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is not enabled. Please contact support.';
      default:
        return 'An unexpected authentication error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 1. Firebase Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // 2. Fetch extended profile from Firestore
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        if (userDoc.exists()) {
          onLogin(userDoc.data() as User);
        } else {
          // Fallback if doc missing (e.g. if user was deleted from Firestore but exists in Auth)
          const fallbackUser: User = {
            id: fbUser.uid,
            username: fbUser.email?.split('@')[0] || 'user',
            displayName: fbUser.displayName || 'Nexus Entity',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            bio: 'Synchronizing neural patterns...',
            followers: 0,
            following: 0,
            postsCount: 0
          };
          
          // Create the doc if it's missing to maintain data integrity
          await setDoc(doc(db, "users", fbUser.uid), fallbackUser);
          onLogin(fallbackUser);
        }
      } else {
        // 1. Firebase Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        const username = (displayName || 'user').toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`;

        // 2. Update Auth Profile
        await updateProfile(fbUser, { 
          displayName: displayName || 'Nexus Entity',
          photoURL: avatar 
        });

        // 3. Create Firestore Document
        const newUser: User = {
          id: fbUser.uid,
          username,
          displayName: displayName || 'Nexus Entity',
          email,
          avatar,
          bio: 'Identity initialized. Ready for Nexus synchronization.',
          followers: 0,
          following: 0,
          postsCount: 0
        };

        await setDoc(doc(db, "users", fbUser.uid), newUser);
        onLogin(newUser);
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      const message = getFriendlyErrorMessage(err.code);
      setError(message);
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

      <div className="max-w-lg w-full relative z-10">
        <div className="glass-aura rounded-[3.5rem] p-10 md:p-14 refract-border shadow-2xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black font-black text-2xl mx-auto mb-8 shadow-[0_0_40px_rgba(255,255,255,0.2)] rotate-6">
               <div className="w-6 h-6 border-4 border-black rounded-full"></div>
            </div>
            <h1 className="text-4xl font-display font-black text-white mb-3 tracking-tight uppercase">
              {isLogin ? 'Login' : 'Sign Up'}
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[9px]">
              {isLogin ? 'Neural Link Activation' : 'Initialize Identity'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[11px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="group animate-in fade-in slide-in-from-top-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Full Name</label>
                <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all border-white/5">
                  <input
                    type="text"
                    required
                    className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
                    placeholder="E.g. Alex Rivers"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Email Address</label>
              <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all border-white/5">
                <input
                  type="email"
                  required
                  className="w-full bg-transparent border-none focus:outline-none text-white text-sm font-medium placeholder:text-slate-700"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-4">Password</label>
              <div className="glass-aura rounded-2xl px-5 py-3.5 refract-border focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all border-white/5">
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
              className="w-full bg-white text-black font-black py-5 px-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] mt-8"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
            {isLogin ? "New to Nexus? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-slate-300 hover:text-white hover:underline decoration-cyan-500 decoration-2 underline-offset-4"
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
