import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Monitor, Mail, User, Clock, Tag } from 'lucide-react';
import { Template } from '../../store/templateStore';
import { useState } from 'react';

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
}

export default function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');

  // Inject standard CSS to make it look like a real email if it doesn't have its own
  const content = template.body.includes('<html') 
    ? template.body 
    : `
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              margin: 0;
              padding: 20px;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="email-container font-medium leading-relaxed">
            ${template.body.replace(/\n/g, '<br/>')}
          </div>
        </body>
      </html>
    `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl h-[90vh] bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">{template.name}</h2>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                <Tag size={10} />
                {template.category}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Monitor size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Smartphone size={18} />
                </button>
             </div>
             <button 
              onClick={onClose}
              className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"
             >
               <X size={20} />
             </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-slate-50/50">
          {/* Metadata Sidebar */}
          <div className="w-80 border-r border-slate-100 p-8 hidden lg:block overflow-y-auto bg-white">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Template Metadata</h3>
             
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Email Subject</label>
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm italic font-medium text-slate-700 leading-relaxed">
                     "{template.subject}"
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                         <User size={16} />
                      </div>
                      <div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Usage Count</div>
                         <div className="text-sm font-bold text-slate-900">{template.usageCount} Broadcasts</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                         <Clock size={16} />
                      </div>
                      <div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase">Last Modified</div>
                         <div className="text-sm font-bold text-slate-900">{new Date(template.createdAt).toLocaleDateString()}</div>
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                   <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Internal Note</div>
                      <p className="text-xs font-medium leading-relaxed">
                         This template uses <strong>{"{{name}}"}</strong> and <strong>{"{{email}}"}</strong> tokens for dynamic personalization during send.
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Preview Window */}
          <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-y-auto">
             <div className="w-full max-w-4xl mb-4 flex items-center gap-2 px-4 py-2 bg-white/50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono">Mail Preview Viewport</span>
             </div>

             <div className={`transition-all duration-500 shadow-2xl rounded-lg overflow-hidden border border-slate-200 bg-white ${viewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'}`}>
                <iframe 
                  srcDoc={content}
                  className="w-full h-full border-none"
                  title="Email Preview"
                />
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
