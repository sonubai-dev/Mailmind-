import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Sparkles, Loader2 } from 'lucide-react';
import { linkGoogleAccount } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface GoogleConnectPromptProps {
  title?: string;
  description?: string;
}

export default function GoogleConnectPrompt({
  title = "Connect Your Gmail Inbox",
  description = "To use our advanced smart inbox, campaign broadcasts, and auto-replies in real time, connect your Google/Gmail account now."
}: GoogleConnectPromptProps) {
  const { setAccessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const { accessToken } = await linkGoogleAccount();
      if (accessToken) {
        setAccessToken(accessToken);
        toast.success("Successfully linked your Google/Gmail account!");
      } else {
        toast.error("Could not obtain a Gmail access token");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/credential-already-in-use') {
        toast.error("This Google account is already linked to another user profile.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Connecting popup was blocked by your browser. Please enable popups.");
      } else {
        toast.error("Failed to link Google account. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 min-h-[500px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-28 h-28 bg-indigo-100/50 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-16 h-16 bg-indigo-50/80 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 border border-indigo-100 shadow-md shadow-indigo-600/5">
          <Mail size={26} />
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-2 leading-tight tracking-tight font-display">
          {title}
        </h2>
        
        <p className="text-xs text-slate-500 mb-8 leading-relaxed max-w-xs mx-auto font-medium">
          {description}
        </p>
        
        <button
          onClick={handleLinkGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/10 disabled:opacity-75 text-xs"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Sparkles size={14} />
              <span>Connect Google Account</span>
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
