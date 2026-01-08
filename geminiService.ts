import { GoogleGenAI } from "@google/genai";
import { Post } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ECHO_CACHE_KEY = 'nexus_global_echoes_cache';
const SUMMARY_CACHE_KEY = 'nexus_pulse_summary_cache';
const ECHO_CACHE_TTL = 60 * 60 * 1000; // 1 hour for global echoes
const SUMMARY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for pulse summary
const LOCKOUT_KEY = 'nexus_circuit_lockout';

// Internal lock to prevent overlapping calls
const callLocks: Record<string, boolean> = {};

const getLockoutTime = (): number => {
  const saved = localStorage.getItem(LOCKOUT_KEY);
  return saved ? parseInt(saved, 10) : 0;
};

const setLockoutTime = (time: number) => {
  localStorage.setItem(LOCKOUT_KEY, time.toString());
};

/**
 * Robust wrapper for Gemini API calls with exponential backoff and silent failure.
 */
async function callWithRetry(fn: () => Promise<any>, maxRetries = 2): Promise<any> {
  const lockout = getLockoutTime();
  if (Date.now() < lockout) {
    throw new Error('NEURAL_COOLDOWN: Synchronizing local patterns.');
  }

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
      if (isRateLimit) {
        if (i < maxRetries) {
          const delay = (Math.pow(2, i) * 3000) + (Math.random() * 1000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          // Open circuit for 45 seconds during exhaustion
          setLockoutTime(Date.now() + (45 * 1000));
          // Log internally but keep UI clean
          console.debug("Nexus Protocol: Neural buffer full. Activating Archive Sync.");
        }
      }
      throw error;
    }
  }
}

export const generateAIChatResponse = async (history: { role: 'user' | 'model'; parts: { text: string }[] }[]) => {
  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history,
      config: {
        systemInstruction: "You are Nexus AI. Witty, helpful, and concise (max 2 sentences). Use a technical/futuristic tone."
      }
    }), 1);
    return response.text || "Frequencies aligned.";
  } catch (error) {
    return "Local node synchronization optimal. Transmit again in a moment.";
  }
};

export const summarizeFeed = async (posts: Post[]) => {
  if (posts.length === 0) return "The void is quiet. Waiting for transmissions...";
  
  const currentHash = posts.map(p => p.id).sort().join(',');
  const cached = localStorage.getItem(SUMMARY_CACHE_KEY);
  
  if (cached) {
    const { data, timestamp, postHash } = JSON.parse(cached);
    if (postHash === currentHash || (Date.now() - timestamp < SUMMARY_CACHE_TTL)) {
      return data;
    }
  }

  if (Date.now() < getLockoutTime() || callLocks['summarize']) {
    return cached ? JSON.parse(cached).data : "The Pulse is steady. Frequencies are aligning across the cluster.";
  }

  callLocks['summarize'] = true;
  try {
    const postData = posts.map(p => `${p.authorName}: ${p.content}`).join('\n');
    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize this feed in 3 very short atmospheric bullet points. Data:\n${postData}`,
    }));
    
    const summary = response.text;
    localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify({ 
      data: summary, 
      timestamp: Date.now(), 
      postHash: currentHash 
    }));
    return summary;
  } catch (error) {
    return cached ? JSON.parse(cached).data : "Aura is currently fluctuating. Visual sync recommended.";
  } finally {
    callLocks['summarize'] = false;
  }
};

export const generateAIImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Social media ready artistic digital render: ${prompt}. Kinetic aura aesthetics.` }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    }), 0);

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

const FALLBACK_ECHOES: Post[] = [
  {
    id: 'fallback-1',
    userId: 'nexus-ai',
    authorName: 'Nexus Protocol',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NexusAI',
    content: 'All systems are resonating within expected parameters. Stay synchronized. ✨',
    timestamp: 'System Echo',
    likes: 42,
    comments: 0,
    shares: 5,
    commentsList: []
  }
];

export const getGlobalEchoes = async (): Promise<Post[]> => {
  const cached = localStorage.getItem(ECHO_CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < ECHO_CACHE_TTL) return data;
  }

  if (Date.now() < getLockoutTime() || callLocks['echoes']) {
    return cached ? JSON.parse(cached).data : FALLBACK_ECHOES;
  }

  callLocks['echoes'] = true;
  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Return 3 short social posts as JSON. Keys: id, authorName, content, likes.`,
      config: { responseMimeType: "application/json" }
    }));
    
    const rawData = JSON.parse(response.text || "[]");
    const sanitizedData = rawData.map((p: any) => ({
      ...p,
      id: `global-${p.id}`,
      userId: `global-${p.id}`,
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.authorName}`,
      shares: Math.floor(Math.random() * 5),
      timestamp: 'Global Frequency',
      comments: 0,
      commentsList: []
    }));

    localStorage.setItem(ECHO_CACHE_KEY, JSON.stringify({ data: sanitizedData, timestamp: Date.now() }));
    return sanitizedData;
  } catch (error) {
    return cached ? JSON.parse(cached).data : FALLBACK_ECHOES;
  } finally {
    callLocks['echoes'] = false;
  }
};