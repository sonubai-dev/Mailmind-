import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, Sparkles, AlertCircle, CheckCircle2, Play, History, Calendar, Filter, Database, Tag as TagIcon, Save, Copy } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { sendEmail } from '../api/gmail';
import toast from 'react-hot-toast';
import CampaignScheduler from '../components/broadcast/CampaignScheduler';
import ABTestingManager from '../components/broadcast/ABTestingManager';
import GoogleConnectPrompt from '../components/email/GoogleConnectPrompt';

interface Recipient {
  id?: string;
  name: string;
  email: string;
  company?: string;
}

export default function BroadcastPage() {
  const { accessToken, user } = useAuthStore();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sourceMode, setSourceMode] = useState<'csv' | 'audience'>('audience');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  
  // A/B Testing State
  const [isAbTesting, setIsAbTesting] = useState(false);
  const [variationB, setVariationB] = useState({ subject: '', body: '' });

  useEffect(() => {
    if (!isAbTesting) {
      setActiveTab('A');
    }
  }, [isAbTesting]);

  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // Load draft on mount
  useEffect(() => {
    if (!user) return;

    const loadDraft = async () => {
      try {
        const draftDoc = await getDoc(doc(db, 'broadcast_drafts', user.uid));
        if (draftDoc.exists()) {
          const data = draftDoc.data();
          setSubject(data.subject || '');
          setBody(data.body || '');
          setScheduledTime(data.scheduledTime || '');
          setCsvContent(data.csvContent || '');
          setSelectedTag(data.selectedTag || '');
          setSourceMode(data.sourceMode || 'audience');
          setIsAbTesting(data.isAbTesting || false);
          if (data.variationB) {
            setVariationB(data.variationB);
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();
  }, [user]);

  // Auto-save draft with debounce
  useEffect(() => {
    if (!user || isSending) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await setDoc(doc(db, 'broadcast_drafts', user.uid), {
          userId: user.uid,
          subject,
          body,
          scheduledTime,
          csvContent,
          selectedTag,
          sourceMode,
          isAbTesting,
          variationB,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        // Wait a bit to show the "Saved" state briefly
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(timer);
  }, [user, subject, body, scheduledTime, csvContent, selectedTag, sourceMode, isAbTesting, variationB, isSending]);

  const copyFromMaster = () => {
    setVariationB({
      subject: subject,
      body: body
    });
    toast.success('Copied from Variation A');
  };

  if (!accessToken) {
    return (
      <GoogleConnectPrompt 
        title="Connect Google Account for Broadcasts"
        description="To compile, personalize, and securely dispatch bulk broadcasts or newsletters using your active Gmail address, link your Google Account."
      />
    );
  }

  const handleParseCsv = () => {
    const lines = csvContent.split('\n');
    const parsed = lines
      .map(line => {
        const [name, email, company] = line.split(',').map(s => s?.trim());
        if (email && email.includes('@')) {
          return { name: name || 'Valued Customer', email, company };
        }
        return null;
      })
      .filter(Boolean) as Recipient[];
    
    setRecipients(parsed);
    toast.success(`Loaded ${parsed.length} recipients`);
  };

  const handleFetchSegment = async () => {
    if (!selectedTag) return toast.error('Please enter a tag to filter');
    if (!user) return toast.error('User not authenticated');
    try {
      const q = query(
        collection(db, 'contacts'),
        where('userId', '==', user.uid),
        where('tags', 'array-contains', selectedTag)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          company: doc.data().company,
          unsubscribed: doc.data().unsubscribed
        }))
        .filter(c => !c.unsubscribed) as Recipient[];
      
      setRecipients(data);
      toast.success(`Loaded ${data.length} recipients with tag #${selectedTag}`);
    } catch (e) {
      toast.error('Failed to fetch segment');
    }
  };

  const startBroadcast = async () => {
    if (recipients.length === 0) {
      return toast.error('Please add recipients first');
    }
    if (!subject || !body) {
      return toast.error('Master subject and body are required');
    }
    if (isAbTesting && (!variationB.subject || !variationB.body)) {
      return toast.error('Variation B subject and body are required');
    }

    const confirmed = window.confirm(`Ready to ${scheduledTime ? 'schedule' : 'send'} ${isAbTesting ? 'A/B Test' : 'Broadcast'} for ${recipients.length} recipients?`);
    if (!confirmed) return;

    if (scheduledTime) {
      if (user) {
        const campaignData = {
          userId: user.uid,
          name: subject || 'Unnamed Campaign',
          subject: subject,
          body: body,
          variationB: isAbTesting ? variationB : null,
          isAbTesting,
          date: new Date().toISOString(),
          scheduledFor: scheduledTime,
          recipients: recipients,
          totalSent: 0,
          failedCount: 0,
          status: 'scheduled'
        };
        try {
          await addDoc(collection(db, 'broadcasts'), campaignData);
          toast.success(`Campaign scheduled for ${new Date(scheduledTime).toLocaleString()}`);
          setSubject('');
          setBody('');
          setScheduledTime('');
          setRecipients([]);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'broadcasts');
        }
      }
      return;
    }

    setIsSending(true);
    let sent = 0;
    
    for (const recipient of recipients) {
      try {
        const isVersionB = isAbTesting && sent % 2 !== 0;
        const currentSubject = isVersionB ? variationB.subject : subject;
        const currentBody = isVersionB ? variationB.body : body;

        const personalizedSubject = currentSubject
          .replace(/{{name}}/g, recipient.name)
          .replace(/{{email}}/g, recipient.email || '')
          .replace(/{{id}}/g, recipient.id || '');
        
        const personalizedBody = currentBody
          .replace(/{{name}}/g, recipient.name)
          .replace(/{{email}}/g, recipient.email || '')
          .replace(/{{id}}/g, recipient.id || '');

        await sendEmail(accessToken!, {
          to: recipient.email,
          subject: personalizedSubject,
          body: personalizedBody
        });
        
        sent++;
        setProgress({ current: sent, total: recipients.length });
        
        await new Promise(r => setTimeout(r, 800));
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
      }
    }

    setIsSending(false);

    // Save campaign report to Firestore broadcasts collection
    if (user) {
      const campaignData = {
        userId: user.uid,
        name: subject || 'Unnamed Campaign',
        date: new Date().toISOString(),
        totalSent: sent,
        failedCount: recipients.length - sent,
        status: sent === recipients.length ? 'complete' : 'failed'
      };
      try {
        await addDoc(collection(db, 'broadcasts'), campaignData);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'broadcasts');
      }
    }

    toast.success(`${isAbTesting ? 'A/B Testing' : 'Broadcast'} complete: ${sent} sent, ${recipients.length - sent} failed`);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">Broadcast Campaign</h1>
          <div className="flex items-center gap-4">
            <p className="text-slate-500">Send personalized mass emails with AI precision.</p>
            <AnimatePresence>
              {isSaving && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1.5 text-indigo-500 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100"
                >
                  <Save size={10} className="animate-pulse" />
                  <span>Auto-saving...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-600 uppercase tracking-wider">
           <Send size={14} />
           Gmail Direct
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Manager */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-900 font-bold flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Recipient Selection
              </h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setSourceMode('audience')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sourceMode === 'audience' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Audience
                </button>
                <button 
                  onClick={() => setSourceMode('csv')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${sourceMode === 'csv' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Direct
                </button>
              </div>
            </div>

            {sourceMode === 'audience' ? (
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <TagIcon className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter segment tag (e.g. vip, trial)"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
                <button 
                  onClick={handleFetchSegment}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Database size={18} />
                  Fetch Audience Segment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea 
                  placeholder="name, email, company (one per line)"
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <button 
                  onClick={handleParseCsv}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Parse Contacts
                </button>
              </div>
            )}

            {recipients.length > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={16} />
                {recipients.length} recipients verified and ready
              </div>
            )}
          </div>

          {/* Email Content */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-900 font-bold flex items-center gap-2">
                <Send size={18} className="text-indigo-600" />
                {isAbTesting ? 'Split Test Composer' : 'Compose Master'}
              </h2>
              {isAbTesting && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('A')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'A' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Variant A
                  </button>
                  <button 
                    onClick={() => setActiveTab('B')}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'B' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Variant B
                  </button>
                </div>
              )}
             </div>

            <div className="space-y-4">
              {activeTab === 'A' || !isAbTesting ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <input 
                    type="text" 
                    placeholder="Email Subject (use {{name}} for personalization)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  <textarea 
                    placeholder="Hi {{name}}, ... (HTML supported)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full h-64 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium leading-relaxed"
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1">Testing Variation B</span>
                    <button 
                      onClick={copyFromMaster}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                    >
                      <Copy size={12} />
                      <span>Copy from Variant A</span>
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Variation B Subject..."
                    value={variationB.subject}
                    onChange={(e) => setVariationB(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-indigo-50/30 border border-indigo-100 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  <textarea 
                    placeholder="Variation B Body..."
                    value={variationB.body}
                    onChange={(e) => setVariationB(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full h-64 bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium leading-relaxed"
                  />
                </motion.div>
              )}
              
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-2">
                   <AlertCircle size={14} />
                   <span>Tokens: <b>{"{{name}}"}</b>, <b>{"{{email}}"}</b></span>
                 </div>
                 {isAbTesting && (
                   <div className="text-indigo-500">
                     {activeTab === 'A' ? 'Currently Editing Variant A' : 'Currently Editing Variant B'}
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions and Status */}
        <div className="space-y-6">
          <ABTestingManager 
            isEnabled={isAbTesting}
            onToggle={setIsAbTesting}
            variantB={variationB}
            onUpdateVariantB={(updates) => setVariationB(prev => ({ ...prev, ...updates }))}
          />

          <CampaignScheduler 
            scheduledTime={scheduledTime}
            onScheduleChange={setScheduledTime}
          />

          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
            <Sparkles className="absolute top-0 right-0 text-white opacity-20 w-32 h-32 -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-4 relative">{scheduledTime ? 'Schedule Campaign' : 'Launch Campaign'}</h3>
            <p className="text-indigo-100 mb-10 text-sm leading-relaxed relative">
              {scheduledTime 
                ? `This campaign will be queued and sent automatically on ${new Date(scheduledTime).toLocaleString()}.`
                : 'MailMind AI will cycle through each recipient and send a personalized version of your master email.'}
            </p>
            <button 
              disabled={isSending}
              onClick={startBroadcast}
              className={`
                w-full flex items-center justify-center gap-3 py-4 bg-white text-indigo-600 font-black rounded-2xl transition-all shadow-xl relative
                ${isSending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              `}
            >
              {scheduledTime ? <Calendar size={20} /> : <Play fill="currentColor" size={20} />}
              {isSending ? 'Processing...' : scheduledTime ? 'Schedule Broadcast' : 'Start Broadcast'}
            </button>
          </div>

          <AnimatePresence>
            {isSending && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-slate-900 font-bold">Progress</h4>
                  <span className="text-indigo-600 font-black text-xl">{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3 p-0.5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
                  Sent {progress.current} of {progress.total}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-[400px]">
            <h2 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Recipients
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {recipients.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-xs">
                  No recipients loaded
                </div>
              ) : (
                recipients.map((r, i) => (
                  <div key={i} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-slate-900 font-bold text-sm truncate">{r.name}</span>
                    <span className="text-slate-400 text-[10px] uppercase font-bold truncate">{r.email}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
