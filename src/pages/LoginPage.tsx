import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { setUser, setAccessToken } = useAuthStore();
  const navigate = useNavigate();

  // Auth Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user, accessToken } = await signInWithGoogle();
      if (user) {
        setUser(user);
        if (accessToken) {
          setAccessToken(accessToken);
        }
        toast.success(`Welcome back, ${user.displayName || 'User'}!`);
        navigate('/inbox');
      }
    } catch (error: any) {
      if (error && error.code === 'auth/popup-blocked') {
        toast.error('Sign-in popup blocked by browser. Please allow popups.');
      } else {
        toast.error('Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all required fields');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (authMode === 'signup' && !name) {
      return toast.error('Please enter your full name');
    }

    setLoading(true);
    try {
      if (authMode === 'signin') {
        const user = await signInWithEmail(email, password);
        setUser(user);
        toast.success(`Welcome back, ${user.displayName || user.email}!`);
        navigate('/inbox');
      } else {
        const user = await signUpWithEmail(email, password, name);
        setUser(user);
        toast.success(`Account created successfully! Welcome, ${name}!`);
        navigate('/inbox');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error('Invalid email or password');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address format');
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password provider is not enabled in Firebase Console. Please enable it under Auth Providers.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-indigo-600/5 text-center"
      >
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/20 rotate-3 hover:rotate-0 transition-all duration-300">
          <Sparkles className="text-white w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-1 font-display tracking-tight">
          MailMind
        </h1>
        <div className="flex items-center justify-center gap-2 mb-8">
           <p className="text-slate-500 text-sm font-medium">
             Personalized email marketing & CRM.
           </p>
           <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
             Free Forever
           </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-6 border border-slate-200/40">
          <button
            onClick={() => { setAuthMode('signin'); setPassword(''); }}
            className={`
              flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200
              ${authMode === 'signin' 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/30' 
                : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthMode('signup'); setPassword(''); }}
            className={`
              flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-200
              ${authMode === 'signup' 
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/30' 
                : 'text-slate-500 hover:text-slate-800'
              }
            `}
          >
            Create Account
          </button>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 text-left mb-6">
          <AnimatePresence mode="wait">
            {authMode === 'signup' && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl hover:bg-indigo-700 transition-all duration-200 shadow-md shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-75 text-xs"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : authMode === 'signin' ? (
              'Sign In with Password'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-[1px] bg-slate-200 flex-1" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">or sign in with</span>
          <div className="h-[1px] bg-slate-200 flex-1" />
        </div>

        {/* Google Authentication Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-250 shadow-sm active:scale-[0.98] disabled:opacity-70 text-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google & Gmail Account
        </button>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center group">
              <div className="text-slate-900 font-bold text-xs group-hover:text-indigo-600 transition-colors">Inbox</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Managed</div>
            </div>
            <div className="text-center group">
              <div className="text-slate-900 font-bold text-xs group-hover:text-indigo-600 transition-colors">Broadcast</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Scalable</div>
            </div>
            <div className="text-center group">
              <div className="text-slate-900 font-bold text-xs group-hover:text-indigo-600 transition-colors">Auto-Reply</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">AI-Driven</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

