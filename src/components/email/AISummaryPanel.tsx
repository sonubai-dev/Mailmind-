import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  List, 
  FileText, 
  CheckSquare, 
  Smile, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  AlertCircle 
} from 'lucide-react';
import { summarizeCustomEmail } from '../../api/gemini';
import toast from 'react-hot-toast';

interface AISummaryPanelProps {
  emailSubject: string;
  emailBody: string;
  emailSnippet: string;
}

type SummaryStyle = 'bullets' | 'tldr' | 'action' | 'sentiment';

interface SummaryCache {
  bullets?: string;
  tldr?: string;
  action?: string;
  sentiment?: string;
}

export default function AISummaryPanel({
  emailSubject,
  emailBody,
  emailSnippet
}: AISummaryPanelProps) {
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>('bullets');
  const [summaries, setSummaries] = useState<SummaryCache>({});
  const [loading, setLoading] = useState<Record<SummaryStyle, boolean>>({
    bullets: false,
    tldr: false,
    action: false,
    sentiment: false
  });
  const [copied, setCopied] = useState(false);

  // Clear summaries cache when email subject or body changes
  useEffect(() => {
    setSummaries({});
  }, [emailSubject, emailBody]);

  const generateSummary = async (style: SummaryStyle) => {
    // If we already cached this style, don't re-generate unless forced
    if (summaries[style]) return;

    setLoading(prev => ({ ...prev, [style]: true }));
    try {
      // Use full body if available, fallback to snippet
      const contentToSummarize = emailBody || emailSnippet;
      const response = await summarizeCustomEmail(emailSubject, contentToSummarize, style);
      setSummaries(prev => ({ ...prev, [style]: response }));
      toast.success('AI summary generated!');
    } catch (error: any) {
      console.error('Error in AI summary:', error);
      toast.error('Could not generate AI summary');
    } finally {
      setLoading(prev => ({ ...prev, [style]: false }));
    }
  };

  // Auto-generate bullets on load if nothing cached yet
  useEffect(() => {
    generateSummary('bullets');
  }, [emailSubject, emailBody]);

  const handleStyleChange = (style: SummaryStyle) => {
    setSelectedStyle(style);
    if (!summaries[style] && !loading[style]) {
      generateSummary(style);
    }
  };

  const currentSummary = summaries[selectedStyle] || '';
  const currentLoading = loading[selectedStyle];

  const handleCopy = () => {
    if (!currentSummary) return;
    navigator.clipboard.writeText(currentSummary);
    setCopied(true);
    toast.success('Summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: SummaryStyle; label: string; icon: React.FC<any>; desc: string }[] = [
    { id: 'bullets', label: 'Bullets', icon: List, desc: 'Key insights as bullet points' },
    { id: 'tldr', label: 'Executive TL;DR', icon: FileText, desc: 'Single-sentence overview' },
    { id: 'action', label: 'Action Items', icon: CheckSquare, desc: 'Extract tasks and deadlines' },
    { id: 'sentiment', label: 'Sender Tone', icon: Smile, desc: 'Emotions and urgency level' }
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-6 shadow-sm mb-8 relative overflow-hidden group">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-300/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-600/10">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">MailMind Smart Assistant</h3>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Real-time content modeling</p>
          </div>
        </div>
        
        {currentSummary && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => generateSummary(selectedStyle)}
              disabled={currentLoading}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-95 disabled:opacity-50"
              title="Regenerate"
            >
              <RefreshCw size={14} className={currentLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all active:scale-95"
              title="Copy"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 mb-4 border border-slate-200/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedStyle === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleStyleChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all duration-250 relative
                ${isSelected 
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100/30' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }
              `}
              title={tab.desc}
            >
              <Icon size={12} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Output Content area */}
      <div className="min-h-[70px] bg-white border border-slate-100 rounded-xl p-4 shadow-inner relative flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-4 text-center min-h-[50px]"
            >
              {/* Modern shimmer details */}
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
                <RefreshCw size={14} className="animate-spin" />
                <span>Gemini analyzing email metadata...</span>
              </div>
              <p className="text-[10px] text-slate-400 italic">Formatting style: {selectedStyle}</p>
            </motion.div>
          ) : currentSummary ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-slate-700 font-medium leading-relaxed select-text"
            >
              {selectedStyle === 'bullets' ? (
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700 font-medium">
                  {currentSummary.split('\n').map((line, i) => {
                    const cleanLine = line.replace(/^-\s*/, '').replace(/^\*\s*/, '').trim();
                    if (!cleanLine) return null;
                    return <li key={i}>{cleanLine}</li>;
                  })}
                </ul>
              ) : selectedStyle === 'action' ? (
                <div className="space-y-1.5 text-xs">
                  {currentSummary.split('\n').map((line, i) => {
                    const cleanLine = line.replace(/^\d+[\.\)]\s*/, '').replace(/^- \s*/, '').trim();
                    if (!cleanLine) return null;
                    return (
                      <div key={i} className="flex items-start gap-2 group/item py-0.5">
                        <input 
                          type="checkbox" 
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer" 
                          id={`item-${i}`}
                        />
                        <label htmlFor={`item-${i}`} className="text-slate-600 font-medium cursor-pointer transition-colors hover:text-slate-900 flex-1">
                          {cleanLine}
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic block leading-relaxed pr-1">
                  "{currentSummary}"
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center text-slate-400 py-3"
            >
              <AlertCircle size={18} className="text-slate-300 mb-1" />
              <button 
                onClick={() => generateSummary(selectedStyle)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5 mt-1"
              >
                <Zap size={12} />
                Generate {selectedStyle === 'bullets' ? 'bullet summary' : selectedStyle}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
