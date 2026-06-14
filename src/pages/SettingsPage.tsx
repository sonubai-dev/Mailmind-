import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  Mail, 
  Shield, 
  Key, 
  Moon, 
  HelpCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  Server as ServerIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { auth, linkGoogleAccount, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const { user, logout, accessToken, setAccessToken } = useAuthStore();
  const navigate = useNavigate();
  const [linking, setLinking] = useState(false);
  
  // SMTP State
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '465',
    user: '',
    pass: '',
    fromName: '',
    fromEmail: ''
  });
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);

  useEffect(() => {
    const fetchSmtp = async () => {
      if (!user) return;
      const docRef = doc(db, 'integrations', `${user.uid}_smtp`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSmtpConfig(snap.data() as any);
        setIsSmtpConfigured(true);
      }
    };
    fetchSmtp();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (e) {
      toast.error('Failed to logout');
    }
  };

  const handleSmtpSave = async () => {
    if (!user) return;
    setTestingSmtp(true);
    try {
      // Test the connection via backend
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      });
      
      const data = await res.json();
      if (res.ok) {
        await setDoc(doc(db, 'integrations', `${user.uid}_smtp`), {
          ...smtpConfig,
          updatedAt: new Date().toISOString()
        });
        setIsSmtpConfigured(true);
        toast.success('SMTP Settings Verified & Saved!');
      } else {
        toast.error(data.error || 'SMTP Connection Failed');
      }
    } catch (err) {
      toast.error('Could not reach server to test SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinking(true);
    try {
      const { accessToken } = await linkGoogleAccount();
      if (accessToken) {
        setAccessToken(accessToken);
        toast.success("Successfully connected Gmail / Google account!");
      } else {
        toast.error("Successfully signed in, but no access token received.");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/credential-already-in-use') {
        toast.error("This Google account is already linked to another MailMind profile.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Popup blocked! Please allow popups for this site.");
      } else {
        toast.error("Failed to connect Google account.");
      }
    } finally {
      setLinking(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">System Settings</h1>
        <p className="text-slate-500">Manage your account, connections, and engine preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: User Profile */}
        <div className="md:col-span-1">
           <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm sticky top-8">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-indigo-50 shadow-xl shadow-indigo-600/5">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 truncate mb-1 font-display">{user.displayName || 'Unnamed User'}</h3>
              <p className="text-xs text-slate-400 mb-8 truncate font-medium">{user.email}</p>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold rounded-2xl transition-all border border-rose-100 active:scale-95 shadow-sm"
              >
                <LogOut size={18} />
                Disconnect Account
              </button>
           </div>
        </div>

        {/* Right: Settings Sections */}
        <div className="md:col-span-2 space-y-6">
           {/* Custom SMTP Integration */}
           <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-slate-900 font-bold flex items-center gap-2">
                    <ServerIcon size={18} className="text-indigo-600" />
                    Custom SMTP Protocol
                 </h4>
                 {isSmtpConfigured ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded border border-emerald-100">
                       <CheckCircle2 size={10} /> Active
                    </div>
                 ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded border border-amber-100">
                       <AlertCircle size={10} /> Not Configured
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Connect your own SMTP server (Direct Mail, AWS SES, or custom) to use MailMind as a high-powered delivery relay.
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Host</label>
                       <input 
                         type="text" 
                         value={smtpConfig.host}
                         onChange={(e) => setSmtpConfig({...smtpConfig, host: e.target.value})}
                         placeholder="smtp.example.com"
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-indigo-500 transition-all font-medium" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Port</label>
                       <input 
                         type="text" 
                         value={smtpConfig.port}
                         onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})}
                         placeholder="465 / 587"
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-indigo-500 transition-all font-medium" 
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Auth User</label>
                    <input 
                      type="text" 
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig({...smtpConfig, user: e.target.value})}
                      placeholder="apikey or email"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-indigo-500 transition-all font-medium" 
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password / App Secret</label>
                    <input 
                      type="password" 
                      value={smtpConfig.pass}
                      onChange={(e) => setSmtpConfig({...smtpConfig, pass: e.target.value})}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-indigo-500 transition-all font-medium" 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From Name</label>
                       <input 
                         type="text" 
                         value={smtpConfig.fromName}
                         onChange={(e) => setSmtpConfig({...smtpConfig, fromName: e.target.value})}
                         placeholder="MailMind Engine"
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-indigo-500 transition-all font-medium" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender Email</label>
                       <input 
                         type="email" 
                         value={smtpConfig.fromEmail}
                         onChange={(e) => setSmtpConfig({...smtpConfig, fromEmail: e.target.value})}
                         placeholder="noreply@domain.com"
                         className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-indigo-500 transition-all font-medium" 
                       />
                    </div>
                 </div>

                 <button
                   onClick={handleSmtpSave}
                   disabled={testingSmtp}
                   className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all disabled:bg-slate-300 flex items-center justify-center gap-2 group shadow-xl shadow-slate-900/10"
                 >
                    {testingSmtp ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
                    )}
                    {testingSmtp ? 'Testing Connection...' : 'Verify & Save Configuration'}
                 </button>
              </div>
           </div>

           {/* Platform Security */}
           <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
                 <Shield size={18} className="text-indigo-600" />
                 Platform Security
              </h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-400">
                          <Key size={18} />
                       </div>
                       <div className="text-sm">
                          <div className="text-slate-900 font-bold">Gemini API Key</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Managed by AI Studio</div>
                       </div>
                    </div>
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded border border-emerald-100">Connected</span>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className={`p-2 bg-white rounded-lg border border-slate-100 ${accessToken ? 'text-indigo-600' : 'text-amber-500'}`}>
                         <Mail size={18} />
                       </div>
                       <div className="text-sm">
                          <div className="text-slate-900 font-bold">Gmail Scopes</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            {accessToken ? 'Authorized access active' : 'Sync your Google Workspace details'}
                          </div>
                       </div>
                    </div>
                    {accessToken ? (
                       <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded border border-emerald-100">
                         Synced
                       </span>
                    ) : (
                       <button
                         onClick={handleLinkGoogle}
                         disabled={linking}
                         className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                       >
                         {linking ? <Loader2 size={12} className="animate-spin" /> : null}
                         Connect
                       </button>
                    )}
                 </div>
              </div>
           </div>

           {/* API & Connections */}
           <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-slate-900 font-bold flex items-center gap-2">
                  <ExternalLink size={18} className="text-indigo-600" />
                  Email Footer Links
                </h4>
             </div>
             <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Unsubscribe Link</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/unsubscribe/{{id}}`);
                        toast.success('Token copied');
                      }}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      Copy Token
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-100 truncate">
                    {window.location.origin}/unsubscribe/{"{{id}}"}
                  </div>
               </div>
               
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Preference Center</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/preferences/{{id}}`);
                        toast.success('Token copied');
                      }}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      Copy Token
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-100 truncate">
                    {window.location.origin}/preferences/{"{{id}}"}
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 italic">Insert these tokens in your templates. {"{{id}}"} will be dynamically replaced.</p>
             </div>
           </div>

           {/* Free Forever Badge */}
           <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40">
             <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
               <Sparkles size={200} />
             </div>
             
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-8">
                  <div className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                    Community Open Access
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               </div>

               <h3 className="text-3xl font-black mb-6 tracking-tight leading-tight">MailMind for Everyone.<br />Free Forever.</h3>
               <p className="text-indigo-200 text-sm max-w-md mb-10 leading-relaxed font-medium">
                 We believe in empowering small businesses. All core features including Gemini AI automations, secure API access, and audience management are completely free with no hidden charges.
               </p>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'AI Drafting', status: 'Unlimited' },
                    { label: 'API Access', status: 'Stable' },
                    { label: 'Audience', status: 'Infinite' },
                    { label: 'Support', status: 'Community' }
                  ].map(stat => (
                    <div key={stat.label} className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                       <div className="text-[9px] font-black uppercase text-indigo-300 tracking-widest mb-1">{stat.label}</div>
                       <div className="text-sm font-black text-white">{stat.status}</div>
                    </div>
                  ))}
               </div>
             </div>
           </div>

           {/* Preferences */}
           <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
                 <Moon size={18} className="text-indigo-600" />
                 User Interface
              </h4>
              <div className="space-y-4 font-bold text-sm text-slate-600">
                 <div className="flex items-center justify-between">
                    <span>Sleek Light Interface</span>
                    <div className="w-12 h-6 bg-indigo-600 rounded-full relative p-1 transition-all">
                       <div className="absolute right-1 w-4 h-4 bg-white rounded-full shadow-md" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <span className="text-indigo-700">Desktop Notifications</span>
                    <div className="w-12 h-6 bg-indigo-200 rounded-full relative p-1 cursor-pointer">
                       <div className="absolute left-1 w-4 h-4 bg-white rounded-full shadow-md" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Support */}
           <div className="p-8 bg-indigo-600 rounded-3xl flex items-center justify-between shadow-xl shadow-indigo-600/20 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                 <HelpCircle size={80} />
              </div>
              <div className="flex items-center gap-4 relative">
                 <div className="p-3 bg-white/10 text-white rounded-2xl border border-white/20">
                    <HelpCircle size={24} />
                 </div>
                 <div>
                    <h4 className="text-white font-bold">Need Help?</h4>
                    <p className="text-xs text-indigo-100">Browse documentation & guides.</p>
                 </div>
              </div>
              <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center relative group-hover:translate-x-1 transition-transform shadow-lg">
                 <ExternalLink size={18} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
