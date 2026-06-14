import { useState } from 'react';
import { 
  Key, 
  Database, 
  Globe, 
  Shield, 
  Cpu, 
  Zap,
  Plus, 
  Trash2, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

interface McpServer {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline';
  lastChecked: string;
}

export default function ApiSettingsPage() {
  const [apiKey, setApiKey] = useState('sk-****************************');
  const [showApiKey, setShowApiKey] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([
    { id: '1', name: 'GitHub MCP', url: 'https://mcp.github.com/v1', status: 'online', lastChecked: '2 mins ago' },
    { id: '2', name: 'Google Sheets MCP', url: 'https://mcp.google.com/sheets', status: 'online', lastChecked: '5 mins ago' }
  ]);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');

  const handleAddServer = () => {
    if (!newServerName || !newServerUrl) {
      toast.error('Please fill in both name and URL');
      return;
    }
    const newServer: McpServer = {
      id: Date.now().toString(),
      name: newServerName,
      url: newServerUrl,
      status: 'offline',
      lastChecked: 'Just now'
    };
    setMcpServers([...mcpServers, newServer]);
    setNewServerName('');
    setNewServerUrl('');
    toast.success('MCP Server added successfully');
  };

  const removeServer = (id: string) => {
    setMcpServers(mcpServers.filter(s => s.id !== id));
    toast.success('Server removed');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">API & Engine Config</h1>
        <p className="text-slate-500">Configure Model Context Protocol (MCP) servers and external API gateways.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* MCP Servers Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
                <Cpu className="text-indigo-600" size={24} />
                MCP Servers
              </h2>
              <div className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 uppercase tracking-widest">
                Model Context Protocol
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {mcpServers.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-indigo-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${server.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Database size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {server.name}
                        {server.status === 'online' && (
                          <CheckCircle2 size={12} className="text-emerald-500" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{server.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className={`text-[9px] font-black uppercase tracking-wider ${server.status === 'online' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {server.status}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                        {server.lastChecked}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeServer(server.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Add New MCP Server</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input 
                  type="text" 
                  placeholder="Server Name (e.g. Finance Data)"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <input 
                  type="text" 
                  placeholder="Server URL (HTTPS)"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
              <button 
                onClick={handleAddServer}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                <Plus size={18} />
                Connect Server
              </button>
            </div>
          </div>

          {/* API Gateway configuration */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-8 font-display">
              <Globe className="text-indigo-600" size={24} />
              External Gateways
            </h2>
            <div className="space-y-6">
               <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
                  <AlertCircle size={20} className="shrink-0" />
                  <div className="text-xs font-medium leading-relaxed">
                    Connecting to external gateways allows the engine to fetch data from sources not covered by native integrations. Ensure these endpoints support standard authentication.
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                     <span className="text-sm font-bold text-slate-800">REST API Mode</span>
                     <div className="w-12 h-6 bg-indigo-600 rounded-full relative p-1">
                        <div className="absolute right-1 w-4 h-4 bg-white rounded-full" />
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                     <span className="text-sm font-bold text-slate-800">GraphQL Support</span>
                     <div className="w-12 h-6 bg-slate-200 rounded-full relative p-1 cursor-pointer">
                        <div className="absolute left-1 w-4 h-4 bg-white rounded-full" />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Developer Quickstart Guide */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
                  <Zap className="text-amber-500" size={24} />
                  Developer Quickstart
                </h2>
                <p className="text-xs text-slate-500 mt-1">Integrate MailMind AI with your existing business website.</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Step 1: Webhook Endpoint */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">01</div>
                  <h3 className="text-sm font-bold text-slate-800">Global Events Endpoint</h3>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <code className="text-xs font-mono text-indigo-600 truncate mr-4">
                    {window.location.origin}/api/v1/events
                  </code>
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}/api/v1/events`)}
                    className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {/* Step 2: Implementation Snippets */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">02</div>
                  <h3 className="text-sm font-bold text-slate-800">Production Snippets (Node.js/Fetch)</h3>
                </div>
                
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                  <div className="flex border-b border-white/5 px-4">
                    {['Order Flow', 'Booking', 'Inquiry'].map((tab) => (
                      <button 
                        key={tab}
                        className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b-2 border-transparent hover:text-white transition-all first:text-indigo-400 first:border-indigo-400"
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="p-6 overflow-x-auto">
                    <pre className="text-[11px] font-mono leading-relaxed text-indigo-100">
{`const sendOrderEvent = async (orderData) => {
  const response = await fetch('${window.location.origin}/api/v1/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: 'YOUR_API_KEY',
      type: 'order_confirmed',
      data: {
        customer_email: orderData.email,
        customer_name: orderData.name,
        order_items: orderData.items,
        total: orderData.amount
      }
    })
  });
  
  return response.json();
};`}
                    </pre>
                  </div>
                  <div className="bg-white/5 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400">Status: v1 (Stable)</span>
                    </div>
                    <button 
                      onClick={() => toast.success('Snippet copied to clipboard (Mock)')}
                      className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Copy Snippet
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Response Structure */}
              <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                   <Shield className="text-indigo-600" size={18} />
                   <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Self-Healing Automation</h4>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  When your backend sends an event, MailMind AI matches it against your <b>Active Automations</b>. If a match is found, Gemini generates a personalized email contextually based on the <code className="text-[10px] bg-white/50 px-1 rounded">data</code> object provided.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Security & Access */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-900/40 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10">
              <Shield size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 font-display">
                <Key className="text-indigo-400" size={20} />
                Access Keys
              </h3>
              
              <div className="space-y-1 mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Master API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm overflow-hidden focus-within:border-indigo-500 transition-colors">
                    <input 
                      type={showApiKey ? 'text' : 'password'} 
                      value={apiKey} 
                      readOnly 
                      className="bg-transparent border-none outline-none w-full text-indigo-100"
                    />
                  </div>
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <Globe size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                 <button 
                  onClick={() => copyToClipboard(apiKey)}
                  className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
                 >
                   <Copy size={16} />
                   Copy API
                 </button>
                 <button className="flex items-center justify-center gap-2 py-3 bg-indigo-500 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors">
                   Rotate Key
                 </button>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Usage Policies</h4>
                 <div className="flex items-center gap-3 text-xs text-slate-400">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Rate Limit: 5,000 req/min
                 </div>
                 <div className="flex items-center gap-3 text-xs text-slate-400">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    CORS Enabled: Localhost
                 </div>
              </div>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 group cursor-pointer hover:border-indigo-300 transition-all">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white rounded-2xl border border-indigo-100 text-indigo-600">
                   <ExternalLink size={24} />
                </div>
             </div>
             <h4 className="text-slate-900 font-bold mb-1">MCP Docs</h4>
             <p className="text-xs text-slate-500 mb-6">Learn how to build and extend your own Model Context Protocol servers.</p>
             <div className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                Read API Docs
                <span>→</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
