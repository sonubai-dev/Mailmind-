import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

dotenv.config();

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // SMTP Testing Route
  app.post("/api/smtp/test", async (req, res) => {
    const { host, port, user, pass, fromEmail, fromName } = req.body;
    
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: port === '465',
        auth: {
          user,
          pass,
        },
      });

      // Verify connection configuration
      await transporter.verify();

      // Send a test email
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: fromEmail, // Send to self
        subject: "MailMind SMTP Connection Test",
        text: "Success! Your SMTP configuration is working correctly with MailMind AI.",
        html: "<b>Success!</b> Your SMTP configuration is working correctly with MailMind AI.",
      });

      res.json({ status: "success" });
    } catch (error: any) {
      console.error("SMTP Test Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Production Ready Events API ---
  app.post("/api/v1/events", async (req, res) => {
    const { apiKey, type, data } = req.body;

    if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

    try {
      // 1. Verify Integration
      const integrationsRef = db.collection("integrations");
      const integrationSnap = await integrationsRef.where("apiKey", "==", apiKey).limit(1).get();

      if (integrationSnap.empty) {
        return res.status(403).json({ error: "Invalid API Key" });
      }

      const integrationDoc = integrationSnap.docs[0];
      const userId = integrationDoc.data().userId;

      // 2. Log the event
      const logRef = await db.collection("logs").add({
        userId,
        timestamp: new Date().toISOString(),
        recipient: data.customer_email || "unknown",
        subject: `Incoming Event: ${type}`,
        snippet: JSON.stringify(data),
        status: "received"
      });

      // 3. Find Automation Rules
      const automationsRef = db.collection("automations");
      const automationSnap = await automationsRef
        .where("userId", "==", userId)
        .where("type", "==", type)
        .where("status", "==", "active")
        .get();

      const results: any[] = [];

      for (const autoDoc of automationSnap.docs) {
        const automation = autoDoc.data();
        
        // Use Gemini to generate response
        const prompt = `
          System: You are an AI Marketing Assistant named MailMind.
          Event: ${type}
          Data: ${JSON.stringify(data)}
          Rule: ${automation.name}
          
          Task: Write a personalized confirmation or follow-up email.
          Maintain the brand tone. Output strictly the email content.
        `;

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        const responseText = aiResponse.text || "";

        // 4. Attempt to send via Custom SMTP if configured
        let deliveryStatus = "drafted";
        const smtpRef = await db.collection("integrations").doc(`${userId}_smtp`).get();
        
        if (smtpRef.exists) {
          const smtp = smtpRef.data() as any;
          try {
            const transporter = nodemailer.createTransport({
              host: smtp.host,
              port: parseInt(smtp.port),
              secure: smtp.port === '465',
              auth: {
                user: smtp.user,
                pass: smtp.pass,
              },
            });

            await transporter.sendMail({
              from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
              to: data.customer_email,
              subject: automation.name,
              text: responseText,
              html: responseText.replace(/\n/g, '<br>'),
            });
            deliveryStatus = "sent";
          } catch (smtpErr) {
            console.error("SMTP Delivery Error:", smtpErr);
            deliveryStatus = "failed_smtp";
          }
        }

        // Save the drafted response to the log
        await db.collection("logs").doc(logRef.id).update({
          aiGeneratedResponse: responseText,
          status: deliveryStatus
        });

        results.push({
          automationId: autoDoc.id,
          status: deliveryStatus
        });
      }

      res.json({ 
        status: "success", 
        eventId: logRef.id,
        processedActions: results.length,
        deliverySummary: results.map(r => r.status)
      });

    } catch (error: any) {
      console.error("Webhook Error:", error);
      res.status(500).json({ error: "Internal Server Processing Error" });
    }
  });

  // Gemini proxy: Generate email content
  app.post("/api/ai/generate", async (req, res) => {
    try {
      let { prompt, model = "gemini-3.5-flash" } = req.body;
      if (model === "gemini-1.5-flash") model = "gemini-3.5-flash";
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini proxy: Structured prompt
  app.post("/api/ai/structured", async (req, res) => {
    try {
      let { prompt, schema, model = "gemini-3.5-flash" } = req.body;
      if (model === "gemini-1.5-flash") model = "gemini-3.5-flash";
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      res.json({ data: JSON.parse(response.text || "{}") });
    } catch (error: any) {
      console.error("Gemini Structured Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
