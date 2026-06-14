import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Bell,
  Heart,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicPreferencePage() {
  const { contactId } = useParams<{ contactId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contact, setContact] = useState<any>(null);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) return;
      try {
        const docRef = doc(db, 'contacts', contactId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContact(data);
          setIsUnsubscribed(data.unsubscribed || false);
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [contactId]);

  const handleUpdate = async (unsubscribe: boolean) => {
    if (!contactId) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'contacts', contactId);
      await updateDoc(docRef, {
        unsubscribed: unsubscribe,
        updatedAt: new Date().toISOString()
      });
      setIsUnsubscribed(unsubscribe);
      setSuccess(true);
      toast.success(unsubscribe ? 'You have been unsubscribed' : 'Preferences updated');
      
      // Auto-hide success message after 3 seconds if not unsubscribing
      if (!unsubscribe) {
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-xl border border-slate-200">
          <XCircle className="text-rose-500 mx-auto mb-6" size={60} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-500">This preference link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-600/5 border border-slate-200 overflow-hidden"
      >
        <div className="bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Mail size={160} />
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Shield size={40} />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Email Preferences</h1>
            <p className="text-indigo-100 font-medium">Hello, {contact.name || contact.email}</p>
          </div>
        </div>

        <div className="p-12 space-y-10">
          <AnimatePresence mode="wait">
            {success && isUnsubscribed ? (
              <motion.div 
                key="unsubscribed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Unsubscribed Successfully</h2>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                  We're sorry to see you go. You will no longer receive marketing communications from us at <strong>{contact.email}</strong>.
                </p>
                <button 
                  onClick={() => handleUpdate(false)}
                  className="text-indigo-600 font-bold hover:underline py-2"
                >
                  Wait, I made a mistake. Resubscribe me!
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="preferences"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Bell size={16} className="text-indigo-500" />
                    Subscription Status
                  </h3>
                  <div className={`p-6 rounded-3xl border-2 transition-all ${isUnsubscribed ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isUnsubscribed ? 'bg-slate-200 text-slate-500' : 'bg-white text-emerald-600 shadow-sm'}`}>
                          <Mail size={24} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Weekly Broadcasts</div>
                          <div className="text-xs text-slate-500">{isUnsubscribed ? 'Currently Unsubscribed' : 'Active Subscription'}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUpdate(!isUnsubscribed)}
                        disabled={saving}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-black/5 active:scale-95 flex items-center gap-2 ${
                          isUnsubscribed 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                            : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'
                        }`}
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isUnsubscribed ? 'Resubscribe' : 'Unsubscribe'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Heart size={16} className="text-rose-500" />
                    Interest Categories
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Product Updates', 'Sales & Offers', 'Educational Content', 'Partner News'].map((category) => (
                      <div key={category} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-50 cursor-not-allowed">
                        <span className="text-sm font-bold text-slate-600">{category}</span>
                        <div className="w-10 h-5 bg-slate-200 rounded-full relative p-1">
                           <div className="absolute left-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Interest-based segmenting is coming soon.</p>
                </div>

                <div className="flex gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Please note that critical account alerts or transaction confirmations may still be sent to you even if you unsubscribe from marketing emails.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center gap-4">
           <div className="flex items-center gap-4 text-slate-400">
              <HelpCircle size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Support Center</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Privacy Policy</span>
           </div>
           <div className="text-[10px] text-slate-400 font-mono">
              MAILMIND ENGINE VERSION 1.4.2 • SECURE SESSION
           </div>
        </div>
      </motion.div>
    </div>
  );
}
