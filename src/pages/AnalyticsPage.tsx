import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Mail, 
  Bot, 
  CheckCircle,
  Zap,
  Users,
  RefreshCcw,
  Trash2,
  BrainCircuit
} from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal';

const initialData = [
  { name: 'Mon', sent: 400, replies: 240 },
  { name: 'Tue', sent: 300, replies: 139 },
  { name: 'Wed', sent: 200, replies: 980 },
  { name: 'Thu', sent: 278, replies: 390 },
  { name: 'Fri', sent: 189, replies: 480 },
  { name: 'Sat', sent: 239, replies: 380 },
  { name: 'Sun', sent: 349, replies: 430 },
];

export default function AnalyticsPage() {
  const [data, setData] = useState(initialData);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleReset = () => {
    setData(data.map(d => ({ ...d, sent: 0, replies: 0 })));
    toast.success('Analytics data reset successfully');
  };
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">Performance Metrics</h1>
          <p className="text-slate-500">Track your email marketing ROI and AI efficiency.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-all border border-transparent hover:border-rose-100"
          >
            <Trash2 size={18} />
            <span className="text-sm">Reset Data</span>
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
             <Zap size={14} className="text-amber-500" />
             Live Updates
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Emails Sent', value: '12,842', icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'AI Responses', value: '842', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg. Open Rate', value: '34.8%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Subscribers', value: '12.5k', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                 <stat.icon size={24} />
              </div>
              <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">+12%</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1 leading-none">{stat.value}</div>
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900">Email activity</h3>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                 <div className="flex items-center gap-1.5 text-indigo-600">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    Sent
                 </div>
                 <div className="flex items-center gap-1.5 text-purple-600">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    Replies
                 </div>
              </div>
           </div>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="replies" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorReplies)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
           <h3 className="text-lg font-bold text-slate-900 mb-8">Daily engagement</h3>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="sent" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="replies" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Campaign Efficiency */}
      <div className="bg-white border border-slate-200 rounded-3xl p-10 overflow-hidden relative shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 mb-8 relative">
           <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
             <BrainCircuit size={32} />
           </div>
           <div>
            <h3 className="text-2xl font-bold text-slate-900">AI Efficiency Score</h3>
            <p className="text-slate-500">How much of your workload is automated by MailMind AI.</p>
           </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-10 relative">
           <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Current automation rate</span>
                <span className="text-3xl font-black text-indigo-600">88.4%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner border border-slate-200">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '88.4%' }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full shadow-lg shadow-indigo-600/20" 
                 />
              </div>
              <div className="mt-4 flex gap-6">
                <div className="text-xs">
                  <div className="text-slate-400 font-bold uppercase tracking-tighter mb-1">Response speed</div>
                  <div className="text-slate-900 font-bold">+412% faster</div>
                </div>
                <div className="text-xs">
                  <div className="text-slate-400 font-bold uppercase tracking-tighter mb-1">Human accuracy</div>
                  <div className="text-slate-900 font-bold">Matching persona</div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleReset}
        title="Reset Analytics"
        message="Are you sure you want to clear all performance metrics? This operation will reset all live counters to zero. This cannot be undone."
        confirmText="Reset Now"
      />
    </div>
  );
}
