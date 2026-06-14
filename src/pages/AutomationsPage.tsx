import { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Mail,
  UserPlus,
  ShoppingBag,
  Calendar,
  Settings,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layout
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { Automation } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const AUTOMATION_TYPES = [
  { id: 'welcome', name: 'Welcome Message', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Triggered when a new contact is added.' },
  { id: 'order', name: 'Order Details', icon: ShoppingBag, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Send summary after an external order event.' },
  { id: 'booking', name: 'Booking Confirm', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Confirm appointments from your site.' },
  { id: 'custom', name: 'Custom Trigger', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Define your own JSON webhook trigger.' }
];

import AutomationLogs from '../components/automations/AutomationLogs';

export default function AutomationsPage() {
  const { user } = useAuthStore();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('welcome');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const automationsQ = query(collection(db, 'automations'), where('userId', '==', user.uid));
        const templatesQ = query(collection(db, 'templates'), where('userId', '==', user.uid));
        
        const [automationsSnap, templatesSnap] = await Promise.all([
          getDocs(automationsQ),
          getDocs(templatesQ)
        ]);

        const automationsList: Automation[] = [];
        automationsSnap.forEach((doc) => {
          automationsList.push({ id: doc.id, ...doc.data() } as Automation);
        });

        const templatesList: any[] = [];
        templatesSnap.forEach((doc) => {
          templatesList.push({ id: doc.id, ...doc.data() });
        });

        setAutomations(automationsList);
        setTemplates(templatesList);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load rules');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newName) return;

    try {
      const data = {
        userId: user.uid,
        name: newName,
        type: newType as any,
        trigger: newType === 'welcome' ? 'contact_added' : `${newType}_event`,
        templateId: selectedTemplateId,
        status: 'active',
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'automations'), data);
      setAutomations([{ id: docRef.id, ...data } as Automation, ...automations]);
      setIsModalOpen(false);
      setNewName('');
      toast.success('Assistant rule activated 24/7');
    } catch (error) {
      toast.error('Failed to create rule');
    }
  };

  const toggleStatus = async (item: Automation) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      await updateDoc(doc(db, 'automations', item.id), { status: newStatus });
      setAutomations(automations.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
      toast.success(`Rule ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'automations', id));
      setAutomations(automations.filter(a => a.id !== id));
      toast.success('Rule deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">AI Assistant Logic</h1>
          <p className="text-slate-500">Configure 24/7 automation rules for your connected data sources.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>New Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
             <div className="flex items-center justify-center py-20">
               <RefreshCw className="animate-spin text-slate-300" size={40} />
             </div>
          ) : automations.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <Zap size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No active roles</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">
                Your assistant is waiting for instructions. Create your first role to handle welcome messages or order confirmations.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {automations.map((item) => {
                 const typeData = AUTOMATION_TYPES.find(t => t.id === item.type) || AUTOMATION_TYPES[0];
                 const template = templates.find(t => t.id === item.templateId);

                 return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${typeData.bg} ${typeData.color} flex items-center justify-center shrink-0`}>
                          <typeData.icon size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-bold text-slate-900 text-lg font-display">{item.name}</h3>
                             <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full border ${item.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                               {item.status}
                             </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mb-4">{typeData.desc}</p>
                          
                          <div className="flex flex-wrap gap-4">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Zap size={12} className="text-amber-500" />
                                TRIGGER: {item.trigger.toUpperCase()}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Mail size={12} className="text-indigo-500" />
                                TEMPLATE: {template?.name || 'GENERIC AI RESPONSE'}
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleStatus(item)}
                          className={`p-2 rounded-xl border transition-all ${item.status === 'active' ? 'bg-amber-50 text-amber-500 border-amber-100 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100 hover:bg-emerald-100'}`}
                        >
                          {item.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-slate-50 text-slate-300 hover:text-rose-500 border border-slate-100 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles size={100} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-6 font-display flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={24} />
                    Assistant Core
                 </h3>
                 <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Response Personality</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-indigo-100 mt-2 focus:outline-none focus:border-indigo-400 transition-colors">
                        <option value="helpful">Helpful Assistant</option>
                        <option value="professional">Professional Concierge</option>
                        <option value="friendly">Store Manager</option>
                        <option value="tech">Support Engineer</option>
                      </select>
                   </div>

                   <div className="pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-300">24/7 Monitoring</span>
                        <div className="w-10 h-5 bg-emerald-500 rounded-full relative p-1">
                           <div className="absolute right-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Priority Queuing</span>
                        <div className="w-10 h-5 bg-white/10 rounded-full relative p-1">
                           <div className="absolute left-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                   </div>

                   <button className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                      <Settings size={18} />
                      Global Config
                   </button>
                 </div>
              </div>
           </div>

           <AutomationLogs />
        </div>
      </div>

       {/* Create Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-white"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 font-display">New Assistant Role</h2>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Website Welcome Bot"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trigger Event Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AUTOMATION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewType(type.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          newType === type.id 
                            ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/5' 
                            : 'bg-white border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                        }`}
                      >
                        <type.icon size={20} className={newType === type.id ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className={`text-xs font-bold ${newType === type.id ? 'text-indigo-600' : 'text-slate-500'}`}>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Response Template (Optional)</label>
                  <select 
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  >
                    <option value="">AI Dynamic Response (No Template)</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 mt-2">
                     <Sparkles size={14} className="text-amber-500" />
                     <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                       {selectedTemplateId ? 'The assistant will use your template as a base for personalization.' : 'Gemini will dynamically craft a response based on the incoming event data.'}
                     </p>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreate}
                    className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                  >
                     Activate Role
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
