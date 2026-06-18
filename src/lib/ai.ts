import { useState } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  attachments?: {
    type: 'image' | 'file' | 'video' | 'audio';
    url: string;
    name: string;
    mimeType: string;
  }[];
}

export interface NexusSettings {
  personality: 'assistant' | 'coder' | 'teacher' | 'researcher' | 'friendly' | 'professional';
  style: 'precise' | 'balanced' | 'creative';
  length: 'short' | 'medium' | 'long';
  dynamicRouting: boolean;
  modelMode: 'turbo' | 'deep_think' | 'creative' | 'quantum_qwen';
  preferredModelId?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  type: 'chat' | 'vision' | 'image' | 'code';
  description: string;
  category: string;
  why?: string;
  apiModel?: string;
  costType?: 'free' | 'paid';
  inputModalities?: ('text' | 'image' | 'audio' | 'video')[];
  capabilities?: ('coding' | 'reasoning' | 'image-to-text' | 'video-generation' | 'general')[];
}

export const MODELS: Model[] = [
  { 
    id: 'nvidia-nemotron-3-super-free', 
    name: 'Nemotron 3 Super 120B Free', 
    provider: 'openrouter', 
    type: 'chat', 
    description: 'Freshly refined high-capacity conversational NVIDIA voice and instruction tuning powerhouse.',
    category: 'General Chat',
    apiModel: 'nvidia/nemotron-3-super-120b-a12b:free',
    costType: 'free',
    inputModalities: ['text'],
    capabilities: ['general']
  },
  { 
    id: 'cohere-north-mini-code-free', 
    name: 'Cohere North Mini Code', 
    provider: 'openrouter', 
    type: 'code', 
    description: 'High performance free code generation engine powered by Cohere North Mini.',
    category: 'Coding',
    apiModel: 'cohere/north-mini-code:free',
    costType: 'free',
    inputModalities: ['text'],
    capabilities: ['coding']
  }
];

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async (messages: Message[], settings: NexusSettings, onUpdate?: (content: string) => void, manualModelId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const trimmedMessages = messages.length > 20 ? messages.slice(-20) : messages;

      // Determine model and provider
      const activeModelId = manualModelId || 'nvidia-nemotron-3-super-free';
      const modelDef = MODELS.find(m => m.id === activeModelId);
      const activeProvider = modelDef ? modelDef.provider : 'openrouter';

      // Load custom purpose model mappings from localStorage
      let cachedPurposeMapping = {};
      try {
        const stored = localStorage.getItem('nexus_custom_purpose_mapping');
        if (stored) {
          cachedPurposeMapping = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Failed parsing cached purpose mappings", e);
      }

      // Load keys from localStorage (client-side user keys option)
      const cachedGeminiKey = localStorage.getItem('nexus_custom_gemini_key') || '';
      const cachedOpenRouterKey = localStorage.getItem('nexus_custom_openrouter_key') || '';
      const cachedNvidiaKey = localStorage.getItem('nexus_custom_nvidia_key') || '';

      // Check if we can make server-side proxy request or need client-side static route fallback
      let response: Response | null = null;
      let useClientFallback = false;

      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: trimmedMessages.map(m => ({ 
              role: m.role, 
              content: m.content,
              attachments: m.attachments 
            })), 
            model: modelDef?.apiModel || activeModelId,
            provider: activeProvider,
            settings: settings,
            purposeMapping: cachedPurposeMapping,
            userKeys: {
              gemini: cachedGeminiKey,
              openrouter: cachedOpenRouterKey,
              nvidia: cachedNvidiaKey
            }
          }),
        });

        if (response.status === 404 || response.status === 405) {
          useClientFallback = true;
        }
      } catch (mockFetchErr) {
        useClientFallback = true;
      }

      // 1. Static Client-Side Fallback (Perfect for GitHub Pages)
      if (useClientFallback) {
        console.log("[GitHub Pages Fallback] Executing direct client-side query...");
        
        // Let's check for Image generation prompt keywords first
        const lastMessage = trimmedMessages[trimmedMessages.length - 1];
        const prompt = (lastMessage?.content || "").trim().toLowerCase();
        const imageKeywords = ['generate an image', 'draw ', 'create a picture', 'imagine ', 'show me a photo', 'visualize '];
        const isImageRequest = imageKeywords.some(k => prompt.includes(k)) && prompt.length < 250;

        if (isImageRequest) {
          const cleanPrompt = lastMessage.content;
          const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
          const textSnippet = `![Generated Image](${pollinationsUrl})\n\nNexus Creative Engine synchronized this for you based on your prompt: "${cleanPrompt}"`;
          if (onUpdate) onUpdate(textSnippet);
          return {
            content: textSnippet,
            model: 'Image Generator'
          };
        }

        const openRouterKey = cachedOpenRouterKey || localStorage.getItem('nexus_custom_openrouter_key') || '';
        if (!openRouterKey) {
          throw new Error("GitHub/Static Pages active: Please supply your OpenRouter API Key in settings (under the 'API Keys & Routing' tab) to run queries inside a static hosting environment!");
        }

        // Establish System Intent / Tone mapping
        let systemPrompt = "You are Nexus AI, a helpful, intelligent assistant. Provide rich, detailed responses with clear structure.";
        if (settings?.personality === 'coder') {
          systemPrompt = "You are a Nexus Coding Expert. Provide concise, clean, and optimized code solutions with accurate syntax.";
        } else if (settings?.personality === 'teacher') {
          systemPrompt = "You are a Nexus Teacher. Explain concepts simply and patiently, using analogies where helpful.";
        } else if (settings?.personality === 'researcher') {
          systemPrompt = "You are a Nexus Researcher. Provide detailed, factual, and academic analysis with citations where possible.";
        } else if (settings?.personality === 'friendly') {
          systemPrompt = "You are a friendly Nexus companion. Be informal, warm, and engaging.";
        } else if (settings?.personality === 'professional') {
          systemPrompt = "You are a Nexus Professional Assistant. Maintain a formal, polite, and efficient tone.";
        }

        if (settings?.length === 'short') {
          systemPrompt += " Please keep your response very brief and direct (under 120 words).";
        } else if (settings?.length === 'long') {
          systemPrompt += " Please prepare a highly comprehensive, detailed, and structured response with complete explanations.";
        }

        let temperature = 0.7;
        if (settings?.style === 'precise') temperature = 0.2;
        if (settings?.style === 'creative') temperature = 1.15;

        // Perform fetch directly to OpenRouter client-side
        const actualApiModel = modelDef?.apiModel || 'nvidia/nemotron-3-super-120b-a12b:free';
        const apiMessages = [
          { role: 'system', content: systemPrompt },
          ...trimmedMessages.map(m => {
            if (m.attachments && m.attachments.length > 0) {
              const parts: any[] = [{ type: 'text', text: m.content }];
              m.attachments.forEach(att => {
                if (att.url && att.url.startsWith('data:')) {
                  parts.push({
                    type: 'image_url',
                    image_url: { url: att.url }
                  });
                }
              });
              return { role: m.role, content: parts };
            }
            return { role: m.role, content: m.content };
          })
        ];

        const clientResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://github.com/',
            'X-Title': 'Nexus Portfolio Workspace'
          },
          body: JSON.stringify({
            model: actualApiModel,
            messages: apiMessages,
            temperature,
            stream: true
          })
        });

        if (!clientResponse.ok) {
          const clientErr = await clientResponse.json().catch(() => ({}));
          throw new Error(clientErr?.error?.message || `Direct Client Fetch Failed (${clientResponse.status})`);
        }

        const reader = clientResponse.body?.getReader();
        if (!reader) throw new Error("Stream Reader Failed");

        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            
            const rawData = trimmed.slice(6);
            if (rawData === '[DONE]') break;

            try {
              const parsed = JSON.parse(rawData);
              const chunk = parsed.choices?.[0]?.delta?.content || "";
              if (chunk) {
                fullContent += chunk;
                if (onUpdate) onUpdate(fullContent);
              }
            } catch (e) {
              // skip incomplete chunk lines
            }
          }
        }

        return {
          content: fullContent,
          model: modelDef ? modelDef.name : 'Nexus Adaptive'
        };
      }

      // 2. Fall back to standard server-side streaming parse if `/api/chat` succeeded
      if (!response) {
        throw new Error("No network response");
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Neural Link Interrupted");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream Reader Failed");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                fullContent += parsed.content;
                if (onUpdate) onUpdate(fullContent);
              }
            } catch (e: any) {
              if (e.message && (e.message.includes("TOO HIGH FOR YOUR PLAN") || !data.includes("unexpected token"))) {
                throw e;
              }
              console.warn("Incomplete JSON chunk or handled error", line);
            }
          }
        }
      }

      return {
        content: fullContent,
        model: modelDef ? modelDef.name : 'Nexus Adaptive'
      };
    } catch (err: any) {
      const errorMessage = err.message || "Nexus Response Failed";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (prompt: string) => {
    setLoading(true);
    setError(null);
    try {
      let isLocalEndpoint = true;
      let response;
      try {
        response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (response.status === 404 || response.status === 405) {
          isLocalEndpoint = false;
        }
      } catch (e) {
        isLocalEndpoint = false;
      }

      if (!isLocalEndpoint) {
        console.log("[GitHub Pages Fallback] Generating image statically via Pollinations...");
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
        return pollinationsUrl;
      }

      if (!response || !response.ok) throw new Error("Image Generation Failed");
      const data = await response.json();
      return data.image;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { request, generateImage, loading, error };
}
