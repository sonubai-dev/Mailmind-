import axios from 'axios';

export async function generateEmailContent(prompt: string) {
  const res = await axios.post('/api/ai/generate', { prompt });
  return res.data.text;
}

export async function generateStructuredAI(prompt: string, schema: any) {
  const res = await axios.post('/api/ai/structured', { prompt, schema });
  return res.data.data;
}

// Higher level helpers
export async function draftReply(originalEmail: string, tone: string, instruction: string) {
  const prompt = `
    Original Email:
    ${originalEmail}
    
    User Instruction: ${instruction}
    Tone: ${tone}
    
    Task: Write a reply to the original email based on the instructions. 
    Return ONLY a JSON object with "subject" and "body" (HTML formatted).
  `;
  
  const schema = {
    type: "object",
    properties: {
      subject: { type: "string" },
      body: { type: "string" }
    },
    required: ["subject", "body"]
  };
  
  return generateStructuredAI(prompt, schema);
}

export async function summarizeEmail(content: string) {
  const prompt = `Please summarize this email concisely: ${content}`;
  return generateEmailContent(prompt);
}

export async function summarizeCustomEmail(subject: string, body: string, style: 'bullets' | 'tldr' | 'action' | 'sentiment') {
  let styleInstruction = '';
  switch (style) {
    case 'bullets':
      styleInstruction = 'Provide a concise summary as 3-4 bullet points highlighting key details.';
      break;
    case 'tldr':
      styleInstruction = 'Provide a brief, single-sentence executive TL;DR summary.';
      break;
    case 'action':
      styleInstruction = 'Extract concrete action items, next steps, or deadlines as a numbered list. If there are none, reply with "No specific action items identified."';
      break;
    case 'sentiment':
      styleInstruction = 'Determine the tone, mood, and urgency level of the sender. Keep it to 1-2 lines.';
      break;
  }

  // Clean raw HTML content slightly if it is extremely long
  const cleanedBody = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                          .substring(0, 8000);

  const prompt = `
    Analyze this email and provide a response.
    Subject: ${subject}
    Email Body:
    ${cleanedBody}

    Instruction: ${styleInstruction}
    Response:
  `;

  return generateEmailContent(prompt);
}

export async function rewriteTone(body: string, tone: 'professional' | 'friendly' | 'urgent') {
  const prompt = `
    Rewrite the following email body to have a ${tone} tone. 
    Maintain the core message and all variables like {{name}}, {{company}}, etc.
    If the content is HTML, preserve the HTML structure but update the text.
    
    Email Body:
    ${body}
    
    Rewritten Body:
  `;
  return generateEmailContent(prompt);
}
