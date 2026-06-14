import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAIStore } from '../store/aiStore';
import { fetchInbox, fetchMessage, sendEmail, markAsRead } from '../api/gmail';
import { draftReply } from '../api/gemini';
import { getEmailBody, getHeader } from '../utils/emailParser';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function useAutoReply() {
  const { accessToken, user } = useAuthStore();
  const { isAutoReplyEnabled, persona, keywords, maxPerHour, addLog } = useAIStore();
  const lastCheckRef = useRef<number>(0);
  const repliesThisHourRef = useRef<number>(0);

  useEffect(() => {
    if (!isAutoReplyEnabled || !accessToken || !user) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      // Check every 2 minutes
      if (now - lastCheckRef.current < 120000) return;
      
      // Reset hourly counter if needed (simplified)
      if (now % 3600000 < 120000) repliesThisHourRef.current = 0;
      
      if (repliesThisHourRef.current >= maxPerHour) return;

      lastCheckRef.current = now;
      
      try {
        const inbox = await fetchInbox(accessToken, 5);
        const messages = inbox.messages || [];

        for (const m of messages) {
          const msg = await fetchMessage(accessToken, m.id);
          const isUnread = msg.labelIds.includes('UNREAD');
          
          if (isUnread) {
            const body = getEmailBody(msg.payload);
            const subject = getHeader(msg.payload.headers, 'subject');
            const from = getHeader(msg.payload.headers, 'from');

            // Check keywords if any
            const matchesKeywords = keywords.length === 0 || keywords.some(k => 
              subject.toLowerCase().includes(k.toLowerCase()) || 
              body.toLowerCase().includes(k.toLowerCase())
            );

            if (matchesKeywords) {
              // Generate AI reply
              const reply = await draftReply(body, 'professional', persona);
              
              // Send reply
              await sendEmail(accessToken, {
                to: from,
                subject: `Re: ${subject}`,
                body: reply.body,
                threadId: msg.threadId
              });

              // Mark original as read
              await markAsRead(accessToken, msg.id);

              // Log it
              const logData = {
                userId: user.uid,
                recipient: from,
                subject: subject,
                snippet: reply.body.substring(0, 100),
                status: 'success',
                timestamp: new Date().toISOString()
              };
              
              try {
                await addDoc(collection(db, 'logs'), logData);
              } catch (error) {
                handleFirestoreError(error, OperationType.CREATE, 'logs');
              }
              addLog(logData);
              
              repliesThisHourRef.current++;
              if (repliesThisHourRef.current >= maxPerHour) break;
            }
          }
        }
      } catch (error) {
        console.error("AutoReply Error:", error);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [isAutoReplyEnabled, accessToken, user, persona, keywords, maxPerHour]);
}
