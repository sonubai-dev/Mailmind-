import { useState, useEffect } from 'react';
import { 
  Globe, 
  Plus, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Zap,
  Code,
  Smartphone,
  Layout,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { IntegrationSource } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function IntegrationsPage() {
  const { user } = useAuthStore();
  const [integrations, setIntegrations] = useState<IntegrationSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState('Web');

  useEffect(() => {
    if (!user) return;

    const fetchIntegrations = async () => {
      try {
        const q = query(collection(db, 'integrations'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const list: IntegrationSource[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as IntegrationSource);
        });
        setIntegrations(list);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        toast.error('Failed to load integrations');
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newName) return;

    try {
      const apiKey = `mm_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      const data = {
        userId: user.uid,
        name: newName,
        platform: newPlatform,
        apiKey: apiKey,
        status: 'active',
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'integrations'), data);
      setIntegrations([{ id: docRef.id, ...data }, ...integrations]);
      setIsModalOpen(false);
      setNewName('');
      toast.success('Integration created! Use the API Key to connect your source.');
    } catch (error) {
      console.error('Error creating integration:', error);
      toast.error('Failed to create integration');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'integrations', id));
      setIntegrations(integrations.filter(i => i.id !== id));
      toast.success('Integration removed');
    } catch (error) {
      toast.error('Failed to remove integration');
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key copied to clipboard');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">Data Sources</h1>
          <p className="text-slate-500">Connect your website, mobile app, or external systems to power your AI Assistant.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>New Source</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-slate-300" size={40} />
            </div>
          ) : integrations.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Globe size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">No Sources Connected</h3>
               <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
                 Add a web or app source to start receiving real-time data for your automated assistant.
               </p>
               <button 
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 font-bold text-sm hover:underline"
               >
                 Create your first integration →
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {integrations.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-indigo-200 transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        {item.platform === 'Web' ? <Globe size={24} /> : item.platform === 'App' ? <Smartphone size={24} /> : <Code size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 font-display">{item.name}</h3>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.platform} • ID: {item.id.substring(0, 8)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-100">
                         {item.status}
                      </span>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret API Key</label>
                       <button 
                        onClick={() => copyKey(item.apiKey)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                       >
                         <Copy size={12} />
                         Copy Key
                       </button>
                    </div>
                    <div className="font-mono text-xs text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-100">
                      {item.apiKey}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <div className="text-slate-400">LAST SYNCED: JUST NOW</div>
                    <div className="flex items-center gap-1 text-indigo-600 hover:underline cursor-pointer">
                      <Zap size={10} />
                      VIEW EVENT LOGS
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 opacity-20">
                 <Code size={120} />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-4 font-display">Production Ready API</h3>
                 <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                   Use our events endpoint to trigger automated emails from your website backend or checkout system.
                 </p>
                 <div className="bg-slate-900 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500" />
                       <div className="w-2 h-2 rounded-full bg-amber-500" />
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <code className="text-[10px] text-indigo-200 block font-mono leading-relaxed overflow-x-auto">
                      {"// Endpoint: "}{window.location.origin}{"/api/v1/events"}<br /><br />
                      {"fetch('/api/v1/events', {"}<br />
                      {"  method: 'POST',"}<br />
                      {"  body: JSON.stringify({"}<br />
                      {"    apiKey: 'YOUR_KEY',"}<br />
                      {"    type: 'order', // Trigger Name"}<br />
                      {"    data: { order_id: '123' }"}<br />
                      {"  })"}<br />
                      {"});"}
                    </code>
                 </div>
                 <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl text-sm shadow-lg shadow-black/10 transition-all hover:bg-slate-50 flex items-center justify-center gap-2">
                    <ExternalLink size={16} />
                    Full Documentation
                 </button>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Live Feed
              </h4>
              <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                         <RefreshCw size={14} />
                      </div>
                      <div>
                         <div className="text-xs font-bold text-slate-800">Event: page_view</div>
                         <div className="text-[9px] text-slate-400">From Localhost • 2 mins ago</div>
                      </div>
                   </div>
                 ))}
                 <button className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
                    View full history →
                 </button>
              </div>
           </div>
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
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-white"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 font-display">New Source</h2>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Source Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Portfolio Website"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Platform Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Web', 'App', 'API'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewPlatform(type)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                          newPlatform === type 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm shadow-indigo-600/5' 
                            : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
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
                    Connect
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
