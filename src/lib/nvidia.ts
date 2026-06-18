/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
export const NVIDIA_API_KEY = (import.meta.env?.VITE_NVIDIA_API_KEY) || "";

export const NVIDIA_IMAGE_MODELS = [
  { id: "stabilityai/sdxl", name: "SDXL 1.0", endpoint: "https://ai.api.nvidia.com/v1/visual/stabilityai/stable-diffusion-xl" },
  { id: "nvidia/edit-anything-sdxl", name: "Edit Anything SDXL", endpoint: "https://ai.api.nvidia.com/v1/visual/nvidia/edit-anything-sdxl" }
];

export async function generateImage(prompt: string, modelId: string = "stabilityai/sdxl", customApiKey?: string) {
  const model = NVIDIA_IMAGE_MODELS.find(m => m.id === modelId) || NVIDIA_IMAGE_MODELS[0];

  let isLocalEndpoint = true;
  let response;
  try {
    response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        modelId,
        apiKey: customApiKey
      })
    });
    if (response.status === 404 || response.status === 405) {
      isLocalEndpoint = false;
    }
  } catch (e) {
    isLocalEndpoint = false;
  }

  if (!isLocalEndpoint) {
    console.log("[GitHub Pages Fallback] Statically generating image via Pollinations.ai...");
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
  }

  try {
    if (!response || !response.ok) {
      const errorText = response ? await response.text() : "No response";
      throw new Error(`Nvidia API Error: ${response ? response.status : 'unknown'} - ${errorText}`);
    }

    const data = await response.json();
    // Nvidia NIM typically returns base64 in artifacts[0].base64
    if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
      return `data:image/png;base64,${data.artifacts[0].base64}`;
    }
    
    throw new Error("No image data returned from Nvidia API");
  } catch (err: any) {
    console.error("Image generation failed, falling back to Pollinations:", err);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}`;
  }
}
