export function createRFC2822Email({ to, from, subject, body, threadId, inReplyTo }: any) {
  const email = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
    inReplyTo ? `References: ${inReplyTo}` : '',
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ].filter(Boolean).join('\r\n');

  // Use btoa safely for binary data if needed, but for strings:
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
