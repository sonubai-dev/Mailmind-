import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Sparkles, Send, Briefcase, Smile, AlertTriangle } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { Template } from '../../store/templateStore';
import { generateEmailContent, rewriteTone } from '../../api/gemini';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  template?: Template | null;
}

export default function TemplateEditor({ onClose, template }: Props) {
  const { user } = useAuthStore();
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'Sales');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleSave = async () => {
    if (!user) return;
    if (!name || !subject || !body) return toast.error('Check all required fields');

    setIsSaving(true);
    try {
      if (template?.id) {
        try {
          await updateDoc(doc(db, 'templates', template.id), {
            name, category, subject, body,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `templates/${template.id}`);
        }
        toast.success('Template updated');
      } else {
        try {
          await addDoc(collection(db, 'templates'), {
            userId: user.uid,
            name,
            category,
            subject,
            body,
            tags: [],
            usageCount: 0,
            aiGenerated: !!aiPrompt,
            createdAt: new Date().toISOString(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'templates');
        }
        toast.success('Template created');
      }
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to save template. Check database or permission rules.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return toast.error('Enter a goal/instruction for AI');
    setIsGenerating(true);
    try {
      const prompt = `
        Write a professional email template.
        Goal: ${aiPrompt}
        Category: ${category}
        Return the result in plain text format but with appropriate HTML line breaks or paragraphs. 
        Start with "Subject: " line then the body.
      `;
      const result = await generateEmailContent(prompt);
      
      const lines = result.split('\n');
      const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));
      if (subjectLine) {
        setSubject(subjectLine.replace(/subject:/i, '').trim());
        setBody(lines.slice(lines.indexOf(subjectLine) + 1).join('\n').trim());
      } else {
        setBody(result);
      }
      toast.success('AI Draft generated');
    } catch (e) {
      toast.error('AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewriteTone = async (tone: 'professional' | 'friendly' | 'urgent') => {
    if (!body) return toast.error('Enter some body text first');
    setIsRewriting(true);
    try {
      const result = await rewriteTone(body, tone);
      setBody(result);
      toast.success(`Converted to ${tone} tone`);
    } catch (e) {
      toast.error('Tone rewriting failed');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#111827] border border-[#1E293B] w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between bg-[#111827]">
          <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
            {template ? 'Edit Template' : 'Create New Template'}
          </h2>
          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:bg-[#1E293B] rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2">Template Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q2 Sales Outreach"
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#4F8EF7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-[#f1f5f9] focus:outline-none focus:border-[#4F8EF7]"
              >
                <option>Sales</option>
                <option>Support</option>
                <option>Newsletter</option>
                <option>Onboarding</option>
                <option>Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2">Email Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Hello {{name}}, checking in..."
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 text-[#F1F5F9] focus:outline-none focus:border-[#4F8EF7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase mb-2">Email Body (HTML)</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#4F8EF7] font-mono"
              />
            </div>
          </div>

          {/* AI Helper Panel */}
          <div className="bg-[#1E293B]/30 border border-[#334155] rounded-3xl p-6 h-fit flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4 text-purple-400">
                <Sparkles size={20} />
                <h3 className="font-bold">Gemini AI Assistant</h3>
              </div>
              <p className="text-sm text-[#94A3B8] mb-6">
                Give Gemini an instruction, persona, or goal, and it will draft the template for you.
              </p>
              
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Write a formal introduction for a new financial consulting service, highlighting our 10% discount for first-time clients."
                className="w-full h-32 bg-[#1B2535] border border-[#334155] rounded-xl p-4 text-[#F1F5F9] text-sm focus:outline-none focus:border-purple-500 mb-4"
              />

              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20"
              >
                <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
                {isGenerating ? 'Gemini is thinking...' : 'Generate with AI'}
              </button>
            </div>

            {/* Tone Rewriter Section */}
            <div className="pt-8 border-t border-[#334155]">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                 <Briefcase size={20} />
                 <h3 className="font-bold">Tone Rewriter</h3>
              </div>
              <p className="text-xs text-[#94A3B8] mb-4">
                Toggle the tone of your current draft while keeping the content and variables intact.
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleRewriteTone('professional')}
                  disabled={isRewriting}
                  className="flex flex-col items-center gap-2 p-3 bg-[#1B2535] border border-[#334155] rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all text-[#94A3B8] hover:text-blue-400"
                >
                  <Briefcase size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Formal</span>
                </button>
                <button 
                  onClick={() => handleRewriteTone('friendly')}
                  disabled={isRewriting}
                  className="flex flex-col items-center gap-2 p-3 bg-[#1B2535] border border-[#334155] rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-all text-[#94A3B8] hover:text-emerald-400"
                >
                  <Smile size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Friendly</span>
                </button>
                <button 
                  onClick={() => handleRewriteTone('urgent')}
                  disabled={isRewriting}
                  className="flex flex-col items-center gap-2 p-3 bg-[#1B2535] border border-[#334155] rounded-xl hover:border-rose-500 hover:bg-rose-500/10 transition-all text-[#94A3B8] hover:text-rose-400"
                >
                  <AlertTriangle size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Urgent</span>
                </button>
              </div>
              {isRewriting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-400 animate-pulse">
                  <Sparkles size={14} className="animate-spin" />
                  Rewriting with Gemini...
                </div>
              )}
            </div>

            <div className="p-4 bg-[#1B2535] rounded-2xl border border-[#334155]">
               <h4 className="text-xs font-bold text-[#94A3B8] uppercase mb-2">Pro Tip</h4>
               <p className="text-xs text-[#64748b]">
                 Use <b>{"{{name}}"}</b>, <b>{"{{email}}"}</b>, or <b>{"{{id}}"}</b> in your text to allow for automatic personalization and preference links.
               </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1E293B] flex items-center justify-end gap-4 bg-[#111827]">
           <button 
             onClick={onClose}
             className="px-6 py-2 text-[#94A3B8] hover:text-[#F1F5F9] font-semibold"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-8 py-2 bg-[#4F8EF7] hover:bg-[#4F8EF7]/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 flex items-center gap-2"
           >
             <Save size={18} />
             {isSaving ? 'Saving...' : 'Save Template'}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
