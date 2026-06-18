/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import OpenAI from "openai";

function getOpenAICompatibleClient(provider: 'openrouter' | 'nvidia', customKey?: string) {
  const isNvidia = provider === 'nvidia';
  const key = customKey || (isNvidia ? process.env.NVIDIA_API_KEY : process.env.OPENROUTER_API_KEY);
  
  if (!key) {
    throw new Error(`${provider === 'nvidia' ? 'NVIDIA' : 'OpenRouter'} API Key is not configured. Please supply one.`);
  }

  return new OpenAI({
    apiKey: key,
    baseURL: isNvidia ? "https://integrate.api.nvidia.com/v1" : "https://openrouter.ai/api/v1",
    defaultHeaders: isNvidia ? {} : {
      "HTTP-Referer": "https://nexus-ai.studio",
      "X-Title": "Nexus AI",
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Unified Direct Multi-Provider Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    const { messages, settings, model, provider, userKeys, purposeMapping } = req.body;

    try {
      if (!messages || messages.length === 0) {
        return res.status(400).json({ error: "Empty conversation payload." });
      }

      let activeProvider = provider || 'openrouter';
      if (activeProvider === 'gemini') {
        activeProvider = 'openrouter';
      }
      let modelId = model || 'nvidia/nemotron-3-super-120b-a12b:free';
      if (modelId === 'openrouter/free' || modelId === 'openrouter-free' || modelId.startsWith('gemini')) {
        modelId = 'nvidia/nemotron-3-super-120b-a12b:free';
      }

      // 1. Detect Creative Synthesis / Image Generation Intent in the User Prompt
      const lastMessage = messages[messages.length - 1];
      const prompt = (lastMessage?.content || "").trim().toLowerCase();

      let selectedProvider = activeProvider;
      let selectedModel = modelId;

      // 1. NEXUS AUTO Dynamic Routing Logic with Llama intelligence analyzer:
      let analyzedPurpose = 'General Chat';
      if (modelId === 'nexus-auto') {
        try {
          const client = getOpenAICompatibleClient('openrouter', userKeys?.openrouter);
          console.log(`[Nexus Routing] Analysing prompt intent using openrouter meta-llama/llama-3.3-70b-instruct:free`);
          
          const analysisRes = await client.chat.completions.create({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
              {
                role: 'system',
                content: 'You are custom prompt router. Analyze the user prompt and classify it into exactly one of these purposes: "Coding", "Reasoning / Math", "General Chat", "File Analysis", "Image Analysis", "Video Analysis", "Agents / Workflows". Reply with ONLY the category name, nothing else. If it refers to writing code, fixing a bug, developing a component, or programming, choose "Coding".'
              },
              {
                role: 'user',
                content: `Prompt to classify:\n"${lastMessage?.content || ''}"`
              }
            ],
            temperature: 0.1,
            max_tokens: 15
          });

          const reply = (analysisRes.choices[0]?.message?.content || "").trim().replace(/[".'“”]/g, '');
          console.log(`[Nexus Routing] Llama Analyzer output: "${reply}"`);
          
          const validPurposes = [
            'Coding', 'Reasoning / Math', 'General Chat', 'File Analysis', 'Image Analysis', 'Video Analysis', 'Agents / Workflows'
          ];
          const found = validPurposes.find(p => reply.toLowerCase().includes(p.toLowerCase()));
          if (found) {
            analyzedPurpose = found;
          } else {
            // regex/keyword fallback
            const codingKeywords = ['code', 'program', 'function', 'react', 'typescript', 'python', 'javascript', 'html', 'css', 'develop', 'class'];
            if (codingKeywords.some(w => prompt.includes(w))) {
              analyzedPurpose = 'Coding';
            }
          }
        } catch (analysisErr: any) {
          console.warn("[Nexus Routing] Llama routing analyzer failed or timed out. Falling back to keyword search.", analysisErr.message);
          const codingKeywords = ['code', 'program', 'function', 'react', 'typescript', 'python', 'javascript', 'html', 'css', 'develop', 'class'];
          if (codingKeywords.some(w => prompt.includes(w))) {
            analyzedPurpose = 'Coding';
          }
        }

        // Map purpose to model ID using client-supplied purposeMapping
        const defaultMapping: Record<string, string> = {
          'Coding': 'qwen/qwen3-coder:free',
          'Reasoning / Math': 'deepseek/deepseek-r1:free',
          'General Chat': 'nvidia/nemotron-3-super-120b-a12b:free',
          'File Analysis': 'qwen/qwen3-next-80b-a3b-thinking:free',
          'Image Analysis': 'qwen/qwen2.5-vl-72b-instruct:free',
          'Video Analysis': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
          'Agents / Workflows': 'deepseek/deepseek-v3:free'
        };

        const resolvedModelId = purposeMapping?.[analyzedPurpose] || defaultMapping[analyzedPurpose] || 'nvidia/nemotron-3-super-120b-a12b:free';
        console.log(`[Nexus Routing] Routing dynamic intent "${analyzedPurpose}" to model ID: "${resolvedModelId}"`);

        const idToApiModel: Record<string, { apiModel: string, provider: string }> = {
          'qwen-3-coder-free-code': { apiModel: 'qwen/qwen3-coder:free', provider: 'openrouter' },
          'deepseek-v3-free-code': { apiModel: 'deepseek/deepseek-v3:free', provider: 'openrouter' },
          'nvidia-llama-3.3-70b': { apiModel: 'meta/llama-3.3-70b-instruct', provider: 'nvidia' },
          'nvidia-nemotron-3-super-120b': { apiModel: 'nvidia/nemotron-3-super-120b-a12b', provider: 'nvidia' },
          'deepseek-r1-free-reasoning': { apiModel: 'deepseek/deepseek-r1:free', provider: 'openrouter' },
          'qwen3-next-thinking-free-reasoning': { apiModel: 'qwen/qwen3-next-80b-a3b-thinking:free', provider: 'openrouter' },
          'claude-3-5-sonnet': { apiModel: 'anthropic/claude-3.5-sonnet', provider: 'openrouter' },
          'qwen3-next-instruct-free-general': { apiModel: 'qwen/qwen3-next-80b-a3b-instruct:free', provider: 'openrouter' },
          'gemma-3-27b-it-free-general': { apiModel: 'nvidia/nemotron-3-super-120b-a12b:free', provider: 'openrouter' },
          'gemini-2.5-flash-free-general': { apiModel: 'nvidia/nemotron-3-super-120b-a12b:free', provider: 'openrouter' },
          'nvidia-nemotron-3-super-free-general': { apiModel: 'nvidia/nemotron-3-super-120b-a12b:free', provider: 'openrouter' },
          'llama-3.3-70b-instruct-free-general': { apiModel: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'openrouter' },
          'gpt-4o-paid-general': { apiModel: 'openai/gpt-4o', provider: 'openrouter' },
          'qwen3-next-thinking-free-file': { apiModel: 'qwen/qwen3-next-80b-a3b-thinking:free', provider: 'openrouter' },
          'nemotron-3-nano-free-file': { apiModel: 'nvidia/nemotron-3-nano-30b-a3b:free', provider: 'openrouter' },
          'nemotron-nano-vl-free-image': { apiModel: 'nvidia/nemotron-nano-12b-v2-vl:free', provider: 'openrouter' },
          'nemotron-3-nano-omni-free-image': { apiModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', provider: 'openrouter' },
          'qwen-vl-free-image': { apiModel: 'qwen/qwen2.5-vl-72b-instruct:free', provider: 'openrouter' },
          'nemotron-3-nano-omni-free-video': { apiModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', provider: 'openrouter' },
          'nemotron-nano-vl-free-video': { apiModel: 'nvidia/nemotron-nano-12b-v2-vl:free', provider: 'openrouter' },
          'qwen-3-coder-free-agent': { apiModel: 'qwen/qwen3-coder:free', provider: 'openrouter' },
          'deepseek-v3-free-agent': { apiModel: 'deepseek/deepseek-v3:free', provider: 'openrouter' }
        };

        const mapped = idToApiModel[resolvedModelId];
        if (mapped) {
          selectedModel = mapped.apiModel;
          selectedProvider = mapped.provider;
        } else {
          selectedModel = resolvedModelId;
          if (resolvedModelId.includes('nvidia') || resolvedModelId.startsWith('meta/llama-3.3') || resolvedModelId.includes('nemotron')) {
            selectedProvider = resolvedModelId.includes('/') && !resolvedModelId.startsWith('nvidia/nemotron') ? 'openrouter' : 'nvidia';
          } else {
            selectedProvider = 'openrouter';
          }
        }
        console.log(`[Nexus Routing] Translated model ID "${resolvedModelId}" to apiModel "${selectedModel}" on provider "${selectedProvider}"`);
      }
      const imageKeywords = ['generate an image', 'draw ', 'create a picture', 'imagine ', 'show me a photo', 'visualize '];
      const isImageRequest = imageKeywords.some(k => prompt.includes(k)) && prompt.length < 250;

      if (isImageRequest) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const cleanPrompt = lastMessage.content;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
        const textSnippet = `![Generated Image](${pollinationsUrl})\n\nNexus Creative Engine synchronized this for you based on your prompt: "${cleanPrompt}"`;

        res.write(`data: ${JSON.stringify({ content: textSnippet })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      // 2. Map System Prompt & Tone settings
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

      // Incorporate Length Strategy in System Instruction to minimize output truncation risks
      if (settings?.length === 'short') {
        systemPrompt += " Please keep your response very brief and direct (under 120 words).";
      } else if (settings?.length === 'long') {
        systemPrompt += " Please prepare a highly comprehensive, detailed, and structured response with complete explanations.";
      }

      // Map Style Parameter to Temperature
      let temperature = 0.7;
      if (settings?.style === 'precise') temperature = 0.2;
      if (settings?.style === 'creative') temperature = 1.15;

      // Handle OpenAI compatible providers (OpenRouter or NVIDIA)
      if (selectedProvider === 'openrouter' || selectedProvider === 'nvidia') {
        const customKey = selectedProvider === 'openrouter' ? userKeys?.openrouter : userKeys?.nvidia;
        const client = getOpenAICompatibleClient(selectedProvider, customKey);

        let apiModel = selectedModel;
        console.log(`Streaming ${selectedProvider} response with model=${apiModel}`);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          const mappedMessages = messages.map((m: any) => {
            if (m.role === 'assistant') {
              return { role: 'assistant', content: m.content || "" };
            }
            if (m.attachments && m.attachments.length > 0) {
              const parts: any[] = [];
              if (m.content) {
                parts.push({ type: 'text', text: m.content });
              }
              m.attachments.forEach((att: any) => {
                if (att.url && att.url.startsWith('data:')) {
                  let mimeType = att.mimeType || '';
                  if (!mimeType) {
                    try {
                      mimeType = att.url.split(';')[0].split(':')[1];
                    } catch (e) {
                      mimeType = '';
                    }
                  }

                  if (mimeType.startsWith('image/')) {
                    parts.push({
                      type: 'image_url',
                      image_url: {
                        url: att.url
                      }
                    });
                  } else if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/plain') {
                    try {
                      const base64Data = att.url.substring(att.url.indexOf(',') + 1);
                      const textContent = Buffer.from(base64Data, 'base64').toString('utf-8');
                      parts.push({
                        type: 'text',
                        text: `\n[Attached Plain-Text File: ${att.name || 'document'}]\n${textContent}\n`
                      });
                    } catch (e) {
                      console.error("Failed to decode text attachment for OpenRouter", e);
                    }
                  } else {
                    parts.push({
                      type: 'text',
                      text: `\n[Attachment Reference: ${att.name || 'document'} (Type: ${mimeType})]\n`
                    });
                  }
                }
              });
              if (parts.length > 0) {
                return { role: m.role || 'user', content: parts };
              }
            }
            return { role: m.role || 'user', content: m.content || "" };
          });

          let stream;
          try {
            stream = await client.chat.completions.create({
              model: apiModel,
              messages: [
                { role: 'system', content: systemPrompt },
                ...mappedMessages
              ],
              temperature: temperature,
              stream: true,
            });
          } catch (err: any) {
            // If the model not found or invalid: fallback to google/gemma-2-9b-it:free
            if (apiModel === 'google/gemma-4-31b-it:free' && (err.status === 400 || err.status === 404 || err.message?.includes('model') || err.message?.includes('not found'))) {
              console.warn("google/gemma-4-31b-it:free failed or not available, falling back to google/gemma-2-9b-it:free");
              apiModel = 'google/gemma-2-9b-it:free';
              stream = await client.chat.completions.create({
                model: apiModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...mappedMessages
                ],
                temperature: temperature,
                stream: true,
              });
            } else {
              throw err;
            }
          }

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
          res.write('data: [DONE]\n\n');
          return res.end();

        } catch (err: any) {
          console.error(`${selectedProvider} Stream Execution Error:`, err);
          const errMsg = err.message || "";
          const status = err.status || err.statusCode || 500;
          
          const isCreditError = status === 402 || 
                                errMsg.toLowerCase().includes("credit") || 
                                errMsg.toLowerCase().includes("payment") || 
                                errMsg.toLowerCase().includes("insufficient") || 
                                errMsg.toLowerCase().includes("plan") || 
                                errMsg.toLowerCase().includes("limit exceeded") ||
                                errMsg.toLowerCase().includes("balance");

          if (isCreditError) {
            res.write(`data: ${JSON.stringify({ error: "TOO HIGH FOR YOUR PLAN" })}\n\n`);
            res.write('data: [DONE]\n\n');
            return res.end();
          } else {
            res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
            res.write('data: [DONE]\n\n');
            return res.end();
          }
        }
      }

      // No fallback Gemini client. If we get here without triggering OpenRouter/NVIDIA block:
      throw new Error(`Unsupported provider configuration, or OpenRouter/NVIDIA endpoint skipped.`);
    } catch (err: any) {
      console.error(`Multi-Provider Server Error:`, err);
      let errMsg = err.message || "Nexus Biological Synapse Error";
      if (typeof errMsg === 'object') {
        try {
          errMsg = JSON.stringify(errMsg);
        } catch (e) {}
      }
      res.status(500).json({ error: errMsg });
    }
  });

  // Image Gen Proxy
  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    
    try {
      const nvidiaKey = process.env.NVIDIA_API_KEY;
      
      if (nvidiaKey) {
        // Newer NVIDIA NIM Image Generation Endpoint (using standard OpenAI-like if possible or direct)
        // Trying the recommended direct NIM endpoint for SDXL
        const response = await fetch("https://ai.api.nvidia.com/v1/genai/stabilityai/sdxl", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            sampler: "K_EULER_ANCESTRAL",
            steps: 20,
            cfg_scale: 7,
            width: 1024,
            height: 1024,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
             return res.json({ image: `data:image/png;base64,${data.artifacts[0].base64}` });
          }
        } else {
           const errBody = await response.text();
           console.warn("NVIDIA Image Gen Failed:", response.status, errBody);
        }
      }

      // Fallback to high-speed Pollinations if NVIDIA is not configured or fails
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
      res.json({ image: pollinationsUrl });
    } catch (err) {
      console.error("Image generation error:", err);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
      res.json({ image: pollinationsUrl });
    }
  });

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
    console.log(`NexusAI Server active on http://localhost:${PORT}`);
  });
}

startServer();
