import { motion, AnimatePresence } from 'motion/react';
import { useEmailStore } from '../../store/emailStore';
import { getHeader, getEmailBody } from '../../utils/emailParser';
import { 
  X, 
  Reply, 
  Forward, 
  Trash2, 
  Archive, 
  Sparkles,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { draftReply } from '../../api/gemini';
import toast from 'react-hot-toast';
import AISummaryPanel from './AISummaryPanel';

export default function EmailThread() {
  const { currentThread: email, setCurrentThread } = useEmailStore();
  const [showSummarizer, setShowSummarizer] = useState(true);

  if (!email) return null;

  const subject = getHeader(email.payload.headers, 'subject') || '(No Subject)';
  const from = getHeader(email.payload.headers, 'from');
  const date = new Date(parseInt(email.internalDate)).toLocaleString();
  const body = getEmailBody(email.payload);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col w-full h-full bg-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentThread(null)}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
              <Trash2 size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Archive">
              <Archive size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSummarizer(!showSummarizer)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all font-bold text-xs ${showSummarizer ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'}`}
          >
            <Sparkles size={14} />
            <span>{showSummarizer ? 'Hide AI Assistant' : 'AI Assistant'}</span>
          </button>
          <button 
            onClick={() => setCurrentThread(null)}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        {/* Subject and Metadata */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 leading-tight tracking-tight mt-1">
            {subject}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20">
              {from[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900">{from}</div>
              <div className="text-xs text-slate-400">{date}</div>
            </div>
          </div>
        </div>

        {/* AI Summary Box */}
        <AnimatePresence>
          {showSummarizer && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <AISummaryPanel 
                emailSubject={subject}
                emailBody={body}
                emailSnippet={email.snippet}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Body */}
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
           <div 
            className="prose prose-slate prose-sm max-w-none prose-headings:font-display prose-a:text-indigo-600"
            dangerouslySetInnerHTML={{ __html: body }} 
          />
        </div>

        {/* Bottom Actions */}
        <div className="mt-10 flex items-center gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
            <Reply size={20} />
            Reply
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl border border-slate-200 transition-all active:scale-95">
            <Forward size={20} />
            Forward
          </button>
        </div>
      </div>
    </motion.div>
  );
}
