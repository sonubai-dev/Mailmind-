import React from 'react';
import { Layers, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ABTestingManagerProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  variantB: {
    subject: string;
    body: string;
  };
  onUpdateVariantB: (updates: { subject?: string; body?: string }) => void;
}

export default function ABTestingManager({
  isEnabled,
  onToggle,
  variantB,
  onUpdateVariantB
}: ABTestingManagerProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">A/B Split Testing</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Optimize Performance</p>
          </div>
        </div>
        
        <button 
          onClick={() => onToggle(!isEnabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
            ${isEnabled ? 'bg-indigo-600' : 'bg-slate-200'}
          `}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-6"
          >
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
              <div className="flex gap-3">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 italic font-medium">
                  MailMind will split your audience 50/50. Half will receive Variation A, and half Variation B.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-indigo-100/50">
                <div className="text-center">
                  <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Variant A</div>
                  <div className="text-sm font-bold text-indigo-700">50%</div>
                </div>
                <div className="h-4 w-px bg-indigo-100" />
                <div className="text-center">
                  <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Variant B</div>
                  <div className="text-sm font-bold text-indigo-700">50%</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Split Rules</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Alternating distribution
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Deterministic personalization
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isEnabled && (
        <p className="text-xs text-slate-400 text-center italic">
          Enable split testing to test different subject lines.
        </p>
      )}
    </div>
  );
}
