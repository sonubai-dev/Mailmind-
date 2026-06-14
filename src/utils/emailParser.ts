export function decodeBase64(data: string) {
  return decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
}

export function getEmailBody(payload: any): string {
  if (!payload) return "";
  
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body && part.body.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        return `<pre style="white-space: pre-wrap; font-family: inherit;">${decodeBase64(part.body.data)}</pre>`;
      }
    }
    // Deep search in nested parts if needed
    for (const part of payload.parts) {
      const body = getEmailBody(part);
      if (body) return body;
    }
  }
  
  return "";
}

export function getHeader(headers: any[], name: string): string {
  if (!headers) return "";
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : "";
}
