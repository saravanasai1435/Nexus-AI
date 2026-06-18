/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
export const OPENROUTER_API_KEY = (import.meta.env?.VITE_OPENROUTER_API_KEY) || "";

export async function chatCompletion(
  messages: { role: string; content: any }[], 
  model: string = "openrouter/auto",
  keys: { openrouterKey?: string } = {}
) {
  let isLocalEndpoint = true;
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        keys
      })
    });
    if (response.status === 404 || response.status === 405) {
      isLocalEndpoint = false;
    }
  } catch (e) {
    isLocalEndpoint = false;
  }

  // Fallback to direct client-side fetch (GitHub Pages)
  if (!isLocalEndpoint) {
    const key = keys.openrouterKey || localStorage.getItem('nexus_custom_openrouter_key') || OPENROUTER_API_KEY;
    if (!key) {
      throw new Error("GitHub Pages Hosting Active: Please enter your OpenRouter Key in local settings to execute completions.");
    }
    const clientResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!clientResponse.ok) {
      const err = await clientResponse.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${clientResponse.status}`);
    }
    return clientResponse.json();
  }

  if (!response || !response.ok) {
    const errorText = await response?.text() || "";
    let errorMessage = "Failed to fetch completion";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
    } catch (e) {
      errorMessage = response ? `HTTP ${response.status}: ${errorText.slice(0, 100)}` : "No network response";
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function* chatCompletionStream(
  messages: { role: string; content: any }[], 
  model: string = "openrouter/auto",
  keys: { openrouterKey?: string } = {}
) {
  let isLocalEndpoint = true;
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        keys
      })
    });
    if (response.status === 404 || response.status === 405) {
      isLocalEndpoint = false;
    }
  } catch (e) {
    isLocalEndpoint = false;
  }

  if (!isLocalEndpoint) {
    const key = keys.openrouterKey || localStorage.getItem('nexus_custom_openrouter_key') || OPENROUTER_API_KEY;
    if (!key) {
      throw new Error("GitHub Pages Hosting Active: Please enter your OpenRouter Key in local settings to stream completions.");
    }
    const clientResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    });

    if (!clientResponse.ok) {
      const err = await clientResponse.text();
      throw new Error(`Direct Stream Error: ${clientResponse.status} - ${err}`);
    }

    const reader = clientResponse.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        
        try {
          const json = JSON.parse(data);
          const chunk = json.choices[0]?.delta?.content || "";
          if (chunk) yield chunk;
        } catch (e) {
          // Skip malformed chunks
        }
      }
    }
    return;
  }

  if (!response || !response.ok) {
    const errorText = await response?.text() || "";
    throw new Error(`Stream Error: ${response?.status || 'No Response'} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;
      
      try {
        const json = JSON.parse(data);
        const chunk = json.choices[0]?.delta?.content || "";
        if (chunk) yield chunk;
      } catch (e) {
        // Skip malformed chunks
      }
    }
  }
}
