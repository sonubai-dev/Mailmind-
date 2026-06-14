import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import { fetchInbox, fetchMessage } from '../api/gmail';
import { getHeader } from '../utils/emailParser';
import { Search, RotateCw, Filter, ChevronRight, User, Mail, Columns2, Split } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import EmailThread from '../components/email/EmailThread';
import GoogleConnectPrompt from '../components/email/GoogleConnectPrompt';

export default function InboxPage() {
  const { accessToken } = useAuthStore();
  const { emails, setEmails, isLoading, setIsLoading, setCurrentThread, currentThread } = useEmailStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Split-pane resizing state
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(35); // Initial 35% left side
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      // Clamp between 22% and 55%
      setLeftWidth(Math.max(22, Math.min(55, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const loadInbox = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await fetchInbox(accessToken);
      const messages = data.messages || [];
      
      const fullMessages = await Promise.all(
        messages.slice(0, 15).map(async (m: any) => {
          return await fetchMessage(accessToken, m.id);
        })
      );
      
      setEmails(fullMessages);
    } catch (error) {
      toast.error('Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadInbox();
    }
  }, [accessToken]);

  if (!accessToken) {
    return (
      <GoogleConnectPrompt 
        title="Connect Your Gmail Inbox"
        description="To read, analyze, and draft smart replies for your actual email inbox in real-time, connect your Google Workspace account."
      />
    );
  }

  const filteredEmails = emails.filter(email => {
    const subject = getHeader(email.payload.headers, 'subject').toLowerCase();
    const from = getHeader(email.payload.headers, 'from').toLowerCase();
    return subject.includes(searchTerm.toLowerCase()) || from.includes(searchTerm.toLowerCase());
  });

  return (
    <div 
      ref={containerRef}
      className={`flex h-full select-none ${isDragging ? 'cursor-col-resize' : ''}`}
    >
      <div 
        className={`flex flex-col min-w-[280px] max-w-full border-r border-slate-200 ${currentThread ? 'hidden lg:flex' : 'flex'} bg-white select-text`}
        style={window.innerWidth >= 1024 ? { width: `${leftWidth}%`, flexShrink: 0 } : {}}
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search in inbox..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Presets Control */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
              <button 
                onClick={() => setLeftWidth(25)}
                className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${leftWidth === 25 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Compact List"
              >
                25%
              </button>
              <button 
                onClick={() => setLeftWidth(35)}
                className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${leftWidth === 35 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Balanced Layout"
              >
                35%
              </button>
              <button 
                onClick={() => setLeftWidth(45)}
                className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${leftWidth === 45 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Wide List Layout"
              >
                45%
              </button>
            </div>

            <button 
              onClick={loadInbox}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50"
              title="Sync Inbox"
            >
              <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-20 rounded-xl w-full" />
              ))}
            </div>
          )}

          {!isLoading && filteredEmails.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Mail size={48} className="mb-4 opacity-20" />
              <p>No emails found</p>
            </div>
          )}

          <AnimatePresence>
            {!isLoading && filteredEmails.map((email, index) => {
              const subject = getHeader(email.payload.headers, 'subject') || '(No Subject)';
              const fromName = getHeader(email.payload.headers, 'from').split('<')[0].trim();
              const fromEmail = getHeader(email.payload.headers, 'from').match(/<(.*)>/)?.[1] || getHeader(email.payload.headers, 'from');
              const isUnread = email.labelIds.includes('UNREAD');
              
              return (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setCurrentThread(email)}
                  className={`
                    flex items-start gap-4 p-4 border-b border-slate-100 cursor-pointer transition-all
                    ${currentThread?.id === email.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}
                    ${isUnread ? 'bg-indigo-50/30' : ''}
                  `}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs truncate ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                        {fromName || fromEmail}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(parseInt(email.internalDate)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className={`text-sm truncate mb-1 ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {subject}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {email.snippet}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 self-center" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Resize Splitter bar */}
      <div 
        onMouseDown={() => setIsDragging(true)}
        className={`hidden lg:flex select-none w-1 cursor-col-resize hover:bg-indigo-500/50 hover:w-1 bg-slate-200/80 border-l border-r border-slate-300/20 relative items-center justify-center transition-colors ${isDragging ? 'bg-indigo-500 w-1' : ''}`}
      >
        <div className="absolute flex flex-col gap-1 py-4 px-0.5 rounded-full bg-slate-200 group-hover:bg-indigo-100 border border-slate-300/40">
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <div className="w-1 h-1 rounded-full bg-slate-400" />
        </div>
      </div>

      {/* Thread View */}
      <div className={`flex-1 min-w-0 bg-slate-50 select-text ${currentThread ? 'flex' : 'hidden lg:flex items-center justify-center'}`}>
        <AnimatePresence mode="wait">
          {currentThread ? (
            <EmailThread key={currentThread.id} />
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-white shadow-xl shadow-indigo-600/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Mail size={32} className="text-indigo-600/30" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Select an email</h2>
              <p className="text-sm text-slate-500">Inbox synchronized with Gemini 3.5 Flash</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
