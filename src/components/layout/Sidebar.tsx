import { NavLink } from 'react-router-dom';
import { 
  Inbox, 
  Send, 
  Mail, 
  Settings, 
  BarChart2, 
  Terminal, 
  Layout as LayoutIcon,
  Sparkles,
  Users,
  Cpu,
  Zap,
  Globe,
  Home,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

const coreItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/contacts', label: 'Audience', icon: Users },
  { to: '/broadcast', label: 'Broadcasts', icon: Send },
  { to: '/templates', label: 'Templates', icon: LayoutIcon },
];

const automationItems = [
  { to: '/auto-reply', label: 'AI Auto-Reply', icon: Terminal },
  { to: '/automations', label: 'Assistant Roles', icon: Zap },
];

const configItems = [
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
  { to: '/integrations', label: 'Integrations', icon: Globe },
  { to: '/settings', label: 'Preferences', icon: Settings },
  { to: '/settings/api', label: 'API & MCP', icon: Cpu },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 font-display uppercase tracking-tight">
          MailMind
        </h1>
      </div>
      
      <nav className="flex-1 px-4 mt-4 space-y-8 pb-8">
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4 text-center border-b border-slate-50 pb-2">Core</div>
          <div className="space-y-0.5">
            {coreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm shadow-indigo-600/5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4 text-center border-b border-slate-50 pb-2">AI Assistant</div>
           <div className="space-y-0.5">
            {automationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm shadow-indigo-600/5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-4 text-center border-b border-slate-50 pb-2">Configuration</div>
          <div className="space-y-0.5">
            {configItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm shadow-indigo-600/5' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <div className="text-[11px]">
            <p className="font-bold text-slate-800">Gemini Active</p>
            <p className="text-slate-500">Engine Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
