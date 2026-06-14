import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  Terminal, 
  Play, 
  Pause, 
  Settings as SettingsIcon, 
  Sparkles, 
  History,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  Bot,
  Mail,
  Zap,
  Power,
  Shield,
  Save,
  Clock,
  Settings2
} from 'lucide-react';

const MessageSquareSync = MessageSquare;
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import GoogleConnectPrompt from '../components/email/GoogleConnectPrompt';

export default function AutoReplyPage() {
  const { user, accessToken } = useAuthStore();
  const [enabled, setEnabled] = useState(false);
  const [persona, setPersona] = useState('');
  const [keywords, setKeywords] = useState('');
  const [delay, setDelay] = useState(0);
  const [maxPerHour, setMaxPerHour] = useState(10);
  const [logs, setLogs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Load Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setEnabled(data.enabled);
        setPersona(data.persona || '');
        setKeywords(data.keywords?.join(', ') || '');
        setDelay(data.delay || 0);
        setMaxPerHour(data.maxPerHour || 10);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/${user.uid}`);
    });

    // Load Logs
    const qLogs = query(
      collection(db, 'logs'), 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logs');
    });

    return () => {
      unsubSettings();
      unsubLogs();
    };
  }, [user]);

  if (!accessToken) {
    return (
      <GoogleConnectPrompt 
        title="Connect Gmail for AI Auto-Replies"
        description="To dynamically scan incoming items, compile context-aware AI answers, and reply to inquiries using your actual email address, please link your Google Account."
      />
    );
  }

  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      try {
        await setDoc(doc(db, 'settings', user.uid), {
          userId: user.uid,
          enabled,
          persona,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          delay,
          maxPerHour,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `settings/${user.uid}`);
      }
      toast.success('AI Settings updated');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">AI Auto-Reply</h1>
          <p className="text-slate-500">Intelligent context-aware automated responses.</p>
        </div>
        <button 
          onClick={() => setEnabled(!enabled)}
          className={`
            relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 shadow-sm
            ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}
          `}
        >
          <span
            className={`
              inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 shadow-md
              ${enabled ? 'translate-x-11' : 'translate-x-1'}
              flex items-center justify-center
            `}
          >
            {enabled ? <Sparkles size={14} className="text-indigo-600" /> : <Pause size={14} className="text-slate-400" />}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <MessageSquare size={120} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 relative">
               <SettingsIcon size={20} className="text-indigo-600" />
               Configuration
            </h3>
            
            <div className="space-y-6 relative">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions for Gemini</label>
                <textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="e.g., You are Alex, helpfully reply to inquiries professionally and suggest a call if interested."
                  className="w-full h-40 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Keyword Filter</label>
                  <input 
                    type="text" 
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="pricing, demo, help"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Max Replies / Hour</label>
                  <input 
                    type="number" 
                    value={maxPerHour}
                    onChange={(e) => setMaxPerHour(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 size={20} />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
               <History size={20} className="text-indigo-600" />
               Recent AI Automation
            </h3>
            
            <div className="space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-10">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                     <History className="text-slate-200" size={24} />
                   </div>
                   <p className="text-slate-400 text-sm italic">AI is waiting for new emails...</p>
                </div>
              ) : (
                logs.map((log) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Bot size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800 truncate">{log.recipient}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 italic">"{log.snippet}"</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / Tips */}
        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
              <Sparkles className="absolute top-0 right-0 text-white opacity-20 w-32 h-32 -mr-10 -mt-10" />
              <div className="relative">
                <h4 className="text-xl font-bold mb-4">Pro Tip</h4>
                <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                  Gemini uses your 'Sent' history to learn your personal writing style. The more you use MailMind, the better the AI gets.
                </p>
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-xs font-bold">Gemini 1.5 Flash Active</span>
                </div>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <h4 className="text-sm font-bold text-slate-800 mb-4">How it works</h4>
             <ul className="space-y-4">
                {[
                  { label: 'Scans inbox every 10 min', icon: Mail },
                  { label: 'Generates context reply', icon: BrainCircuit },
                  { label: 'Marks as read automatically', icon: CheckCircle2 },
                ].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <t.icon size={14} className="text-slate-400" />
                    </div>
                    {t.label}
                  </li>
                ))}
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
