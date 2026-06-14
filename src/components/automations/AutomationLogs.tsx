import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { RefreshCw, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function AutomationLogs() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'logs'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" />
          Recent Activity
        </h3>
        <button 
          onClick={fetchLogs}
          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4">
        {loading && logs.length === 0 ? (
          <div className="py-10 text-center text-slate-300 text-xs font-medium">Checking logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs font-medium">No events captured yet.</div>
        ) : (
          logs.map((log) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={log.id} 
              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 last:mb-0"
            >
              <div className="flex items-center justify-between mb-2">
                 <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{log.subject}</div>
                 <div className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <div className="text-xs font-bold text-slate-800 truncate">{log.recipient}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  log.status === 'processed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {log.status}
                </span>
                <button className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                   Details <ExternalLink size={8} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <button className="w-full mt-6 py-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest border-t border-slate-50 pt-4 transition-colors">
        Open Event Inspector →
      </button>
    </div>
  );
}
