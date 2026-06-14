import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { collection, query, where, getDocs, Timestamp, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { 
  Zap, 
  Mail, 
  BarChart3, 
  ShieldCheck, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  Database
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: '08:00', events: 12 },
  { name: '10:00', events: 45 },
  { name: '12:00', events: 32 },
  { name: '14:00', events: 89 },
  { name: '16:00', events: 54 },
  { name: '18:00', events: 78 },
  { name: '20:00', events: 65 },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    dailyEmails: 0,
    automationEvents: 0,
    totalContacts: 0,
    quotaUsed: 42 // Mock or calculated
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count today's logs
        const qLogs = query(
          collection(db, 'logs'),
          where('userId', '==', user.uid),
          where('timestamp', '>=', today.toISOString())
        );
        const logSnap = await getDocs(qLogs);
        
        // Count total contacts
        const qContacts = query(
          collection(db, 'contacts'),
          where('userId', '==', user.uid)
        );
        const contactSnap = await getDocs(qContacts);

        setStats({
          dailyEmails: logSnap.size, // Assuming each log is an email event
          automationEvents: logSnap.size, 
          totalContacts: contactSnap.size,
          quotaUsed: Math.min(100, (logSnap.size / 500) * 100) // Assuming 500 daily limit for starter
        });
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, [user]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">System Overview</h1>
          <p className="text-slate-500 font-medium">Real-time status of your MailMind engine.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-xs font-black uppercase tracking-widest">Healthy</span>
        </div>
      </header>

      {/* Summary Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Quota Usage Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-600/5 transition-all"
        >
          <div className="flex items-center justify-between mb-8">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Database size={24} />
             </div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Limit</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-end justify-between">
               <div>
                  <div className="text-3xl font-black text-slate-900">{stats.dailyEmails} <span className="text-sm font-medium text-slate-400">Total</span></div>
                  <div className="text-xs font-bold text-slate-500 mt-1">Emails Processed Today</div>
               </div>
               <div className="text-right">
                  <div className="text-sm font-black text-indigo-600">
                    Unlimited Access
                  </div>
               </div>
            </div>
            
            <div className="h-2 bg-indigo-50 rounded-full overflow-hidden shadow-inner border border-indigo-100">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `100%` }}
                 className="h-full rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
               />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Your account has unlimited daily processing power.
            </p>
          </div>
        </motion.div>

        {/* Automation Events Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl hover:shadow-indigo-600/5 transition-all"
        >
          <div className="flex items-center justify-between mb-8">
             <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Zap size={24} />
             </div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Engine</div>
          </div>
          
          <div className="space-y-4">
             <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
                {stats.automationEvents}
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">+12%</div>
             </div>
             <div className="text-xs font-bold text-slate-500">Automation Events (24h)</div>
             <div className="h-10 flex items-end gap-1">
                {[4, 7, 5, 8, 3, 9, 6].map((h, i) => (
                  <div key={i} className="flex-1 bg-amber-100 rounded-t-sm group-hover:bg-amber-400 transition-all" style={{ height: `${h * 10}%` }} />
                ))}
             </div>
          </div>
        </motion.div>

        {/* Trust & Safety Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
             <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">MailMind Intelligence</div>
             <div>
                <h3 className="text-lg font-bold mb-2">99.8% Accuracy</h3>
                <p className="text-indigo-100 text-xs leading-relaxed mb-6">
                  Gemini is currently processing replies with high confidence scores across all active automations.
                </p>
                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-indigo-600 bg-indigo-400 shadow-sm" />
                      ))}
                   </div>
                   <span className="text-[10px] font-bold">Trusted by 200+ small businesses</span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <TrendingUp size={20} className="text-indigo-600" />
               Automation Velocity
            </h3>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-600" /> Success</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200" /> Baseline</div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" stroke="#94a3b8" tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontStyle="bold" stroke="#94a3b8" tickMargin={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5' }}
                />
                <Area type="monotone" dataKey="events" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorEvents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links / Next Steps */}
        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-white relative h-full">
              <h3 className="text-xl font-bold mb-6">Launchpad</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { label: 'Draft Campaign', icon: Mail, to: '/broadcast' },
                   { label: 'Add Contacts', icon: TrendingUp, to: '/contacts' },
                   { label: 'Role Settings', icon: BarChart3, to: '/automations' },
                   { label: 'API Keys', icon: Zap, to: '/settings/api' },
                 ].map((link, i) => (
                   <button key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all text-left flex flex-col gap-4 group">
                      <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                         <link.icon size={20} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{link.label}</span>
                        <ArrowUpRight size={16} className="text-slate-500" />
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
