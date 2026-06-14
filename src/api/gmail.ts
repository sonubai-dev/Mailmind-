import axios from 'axios';
import { createRFC2822Email } from '../utils/base64';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1';

export async function fetchInbox(accessToken: string, maxResults = 25) {
  const res = await axios.get(`${GMAIL_BASE}/users/me/messages`, {
    params: { q: 'label:INBOX', maxResults },
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}

export async function fetchMessage(accessToken: string, id: string) {
  const res = await axios.get(`${GMAIL_BASE}/users/me/messages/${id}`, {
    params: { format: 'full' },
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}

export async function sendEmail(accessToken: string, { to, subject, body, threadId }: any) {
  const raw = createRFC2822Email({ to, subject, body, threadId });
  const res = await axios.post(`${GMAIL_BASE}/users/me/messages/send`, 
    { raw, threadId },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

export async function markAsRead(accessToken: string, id: string) {
  await axios.post(`${GMAIL_BASE}/users/me/messages/${id}/modify`, 
    { removeLabelIds: ['UNREAD'] },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

export async function fetchProfile(accessToken: string) {
  const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.data;
}
