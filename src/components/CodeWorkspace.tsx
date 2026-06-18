import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Code2, 
  Copy, 
  Download, 
  RefreshCw, 
  Eye, 
  Key, 
  Cpu, 
  Sliders, 
  Check, 
  Sparkles, 
  CheckCircle,
  XCircle,
  X,
  HelpCircle,
  Send,
  Zap,
  Info,
  Layers,
  FileCode,
  LayoutGrid,
  Trash2,
  ChevronRight,
  Sparkle,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI, MODELS } from '../lib/ai';

// Pre-loaded templates for a luxurious playground experience
const TEMPLATES = [
  {
    name: "Interactive Analytics Dashboard",
    description: "A beautiful, premium financial and metrics dashboard with reactive charts and modern dark/light contrast.",
    prompt: "Create an interactive metrics and analytics dashboard with SVG-based real-time visualizations, performance metric cards (Conversion Rate, Active Users, Revenue), dynamic mock data filters, and interactive quick-actions.",
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; background-color: #0b0f19; color: #f1f5f9; }
  </style>
</head>
<body class="p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-white flex items-center gap-2">
          <span class="w-2.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
          Nexus Analytics Dashboard
        </h1>
        <p class="text-slate-400 text-sm mt-1">Real-time telemetry and cluster usage metrics.</p>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="refreshData()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700">
          <svg class="w-3.5 h-3.5 animate-spin-reverse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" /></svg>
          Synchronize Nodes
        </button>
        <span class="text-xs font-black px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">● SYSTEM ONLINE</span>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Active Handshakes</p>
        <div class="flex justify-between items-baseline">
          <h3 class="text-3xl font-black text-white" id="stat-users">12,482</h3>
          <span class="text-xs font-bold text-emerald-400 font-mono">+14.2%</span>
        </div>
        <p class="text-[10px] text-slate-400">Concurrent API connections in last 1m</p>
      </div>
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Processing Latency</p>
        <div class="flex justify-between items-baseline">
          <h3 class="text-3xl font-black text-white" id="stat-latency">42 ms</h3>
          <span class="text-xs font-bold text-indigo-400 font-mono">OPTIMAL</span>
        </div>
        <p class="text-[10px] text-slate-400">Average response time over 1,000 requests</p>
      </div>
      <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <p class="text-xs font-bold uppercase tracking-widest text-slate-500">Cluster Load</p>
        <div class="flex justify-between items-baseline">
          <h3 class="text-3xl font-black text-white" id="stat-load">68.4%</h3>
          <span class="text-xs font-bold text-amber-400 font-mono">MODERATE</span>
        </div>
        <p class="text-[10px] text-slate-400">Combined CPU & Memory pool allocation</p>
      </div>
    </div>

    <!-- Chart Panel -->
    <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-sm font-bold tracking-tight text-white uppercase tracking-widest text-slate-400">Network Telemetry (TPS)</h3>
        <span class="text-[10px] font-bold font-mono tracking-wide text-indigo-400">STOCHASTIC SAMPLING</span>
      </div>
      <div class="h-64 flex items-end justify-between gap-2.5 px-4">
        <div class="w-full flex justify-between items-end gap-1.5 h-48" id="chart-bars">
          <!-- Rendered Bars -->
        </div>
      </div>
    </div>

    <!-- Quick controls widget -->
    <div class="p-6 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="text-center md:text-left">
        <h4 class="text-sm font-black text-white">Let-Our-AI Refinement Active</h4>
        <p class="text-slate-400 text-xs mt-0.5">Integrate customizable dashboard parameters using your own custom keys.</p>
      </div>
      <div class="flex gap-2">
        <button onclick="toggleAlert()" id="trigger-hook" class="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg">Interlink Webhooks</button>
        <button onclick="clearTelemetry()" class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition">Clear Telemetry</button>
      </div>
    </div>
  </div>

  <script>
    // Simple bar visualizer state
    const barsContainer = document.getElementById('chart-bars');
    function generateBars() {
      barsContainer.innerHTML = '';
      for (let i = 0; i < 24; i++) {
        const h = Math.floor(Math.random() * 80) + 15;
        const bar = document.createElement('div');
        bar.style.height = h + '%';
        bar.className = 'w-full bg-indigo-500/30 hover:bg-indigo-500 rounded-t-md transition-all cursor-pointer duration-300';
        barsContainer.appendChild(bar);
      }
    }
    generateBars();

    function refreshData() {
      document.getElementById('stat-users').innerText = (12000 + Math.floor(Math.random() * 1900)).toLocaleString();
      document.getElementById('stat-latency').innerText = (30 + Math.floor(Math.random() * 25)) + ' ms';
      document.getElementById('stat-load').innerText = (55 + Math.floor(Math.random() * 25)).toFixed(1) + '%';
      generateBars();
    }

    function toggleAlert() {
      alert("Nexus webhook interlink configured successfully. Port: 3000 sandbox authorized.");
    }
    function clearTelemetry() {
      document.getElementById('stat-users').innerText = '0';
      document.getElementById('stat-latency').innerText = '--';
      document.getElementById('stat-load').innerText = '0.0%';
      barsContainer.innerHTML = '<div class="w-full text-center text-xs text-slate-500 italic py-10">Telemetry cleared.</div>';
    }
  </script>
</body>
</html>`
  },
  {
    name: "Interactive SVG Space Physics Orbit",
    description: "A gorgeous, interactive physics laboratory in orbit, styled with HTML particles and gravitational controls.",
    prompt: "Create an interactive vector-based space physics sandbox showing active solar orbital trajectories. Allow clicking to inject cosmic bodies, customizable slider configurations for orbital speeds, gravitational constants, and clean dark interstellar theme.",
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Space Grotesk', system-ui, sans-serif; background: #030712; color: #fff; overflow: hidden; height: 100vh; }
  </style>
</head>
<body class="flex flex-col h-screen">
  <div class="h-14 border-b border-white/5 flex items-center px-6 justify-between shrink-0 bg-slate-950/80 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="w-3.5 h-3.5 bg-yellow-400 rounded-full animate-ping absolute"></div>
      <div class="w-3.5 h-3.5 bg-yellow-400 rounded-full relative"></div>
      <span class="font-bold text-sm tracking-widest text-slate-200 uppercase">Kinetic Orbit Synapse</span>
    </div>
    <div class="flex items-center gap-4">
      <label class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Speed Mult:</label>
      <input type="range" id="speed" min="0.1" max="3" step="0.1" value="1" class="w-24 accent-yellow-400">
      <button onclick="resetSpace()" class="bg-white/10 hover:bg-white/20 px-3.5 py-1 text-xs font-bold rounded-lg transition">Clear All</button>
    </div>
  </div>

  <div class="flex-1 relative">
    <!-- Click Instructions -->
    <div class="absolute top-4 left-6 pointer-events-none bg-slate-950/70 border border-white/5 p-4 rounded-xl max-w-xs space-y-1">
      <p class="text-xs font-bold text-yellow-400">SYSTEM INTERACTION</p>
      <p class="text-[10px] text-slate-300 leading-normal">Click anywhere inside the vacuum canvas to inject high-mass cosmic anomalies.</p>
    </div>

    <!-- Space Canvas -->
    <svg id="space" class="w-full h-full cursor-crosshair">
      <!-- Sun -->
      <circle cx="50%" cy="50%" r="28" fill="url(#sunGlow)" />
      <defs>
        <radialGradient id="sunGlow">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
      </defs>
    </svg>
  </div>

  <script>
    const svg = document.getElementById('space');
    const speedInput = document.getElementById('speed');
    const bodies = [];
    
    // Solar center coordinates
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;

    window.addEventListener('resize', () => {
      cx = window.innerWidth / 2;
      cy = window.innerHeight / 2;
    });

    // Default planets
    injectPlanet(100, 0.02, 6, '#38bdf8');
    injectPlanet(160, 0.012, 10, '#fb7185');
    injectPlanet(230, 0.007, 14, '#34d399');

    function injectPlanet(radius, speed, size, color) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      el.setAttribute("r", size);
      el.setAttribute("fill", color);
      svg.appendChild(el);
      
      bodies.push({
        el,
        radius,
        angle: Math.random() * Math.PI * 2,
        speed,
        size
      });
    }

    // Click to add custom cosmic body
    svg.addEventListener('click', (e) => {
      if (e.target.id !== 'space') return;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const speed = 0.05 / Math.sqrt(radius / 50); // Keplers law like
      
      const colors = ['#a78bfa', '#fb923c', '#2dd4bf', '#fb7185', '#60a5fa'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      injectPlanet(radius, speed, Math.floor(Math.random() * 8) + 4, randomColor);
    });

    function resetSpace() {
      // Remove all except Defs
      while (svg.childNodes.length > 2) {
        svg.removeChild(svg.lastChild);
      }
      bodies.length = 0;
    }

    // Frame Loop
    function animate() {
      const mult = parseFloat(speedInput.value);
      
      // Update sun coordinates
      const sX = window.innerWidth / 2;
      const sY = (window.innerHeight - 56) / 2;
      
      bodies.forEach(b => {
        b.angle += b.speed * mult;
        const x = sX + Math.cos(b.angle) * b.radius;
        const y = sY + Math.sin(b.angle) * b.radius;
        b.el.setAttribute("cx", x);
        b.el.setAttribute("cy", y);
      });
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`
  },
  {
    name: "Modern Neumorphic Expense Splitting Engine",
    description: "A gorgeous expense sharing utility utilizing clean glass and shadow aesthetics.",
    prompt: "Create an interactive Expense splitter tool. Allow adding multiple members, itemizing mutual purchases, customizing dynamic split shares, and instant beautiful summary visualization.",
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-6 bg-slate-50 text-slate-800">
  <div class="max-w-md mx-auto bg-white border border-slate-200/80 shadow-2xl rounded-3xl p-6 mt-6 space-y-6">
    <div class="text-center">
      <span class="text-[9px] uppercase tracking-widest font-black text-indigo-600 font-mono">Micro Finance Utility</span>
      <h2 class="text-2xl font-black mt-1">Splitify Engine</h2>
      <p class="text-xs text-slate-400 mt-1">Split bills instantly with your customizable crew.</p>
    </div>

    <!-- Active List -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Group size</label>
        <span class="text-xs font-bold text-indigo-600" id="member-count">2 members</span>
      </div>
      <div class="flex gap-2">
        <input type="text" id="member-name" placeholder="Name (e.g. Rachel)" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500">
        <button onclick="addMember()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl text-xs transition">+ Add</button>
      </div>
      <div id="members-list" class="flex flex-wrap gap-1.5 pt-1">
        <span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1.5">You <button onclick="removeMember(this)" class="text-slate-400 select-none">&times;</button></span>
        <span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1.5">Alex <button onclick="removeMember(this)" class="text-slate-400 select-none">&times;</button></span>
      </div>
    </div>

    <!-- Bill setup -->
    <div class="space-y-4 pt-3 border-t border-slate-100">
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Bill Purchase</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
          <input type="number" id="bill-amount" value="84" oninput="calculateSplit()" class="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-3 text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500">
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 text-center space-y-1">
      <p class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Every member pays</p>
      <h3 class="text-3xl font-black text-indigo-600" id="per-person">$42.00</h3>
      <p class="text-[10px] text-slate-400">Divided symmetrically among all linked peers.</p>
    </div>
  </div>

  <script>
    const members = ["You", "Alex"];
    const listEl = document.getElementById('members-list');
    const perPersonEl = document.getElementById('per-person');
    const totalEl = document.getElementById('bill-amount');
    const countEl = document.getElementById('member-count');
    
    function renderMembers() {
      listEl.innerHTML = '';
      members.forEach((m, idx) => {
        listEl.innerHTML += \`<span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1.5">\${m} <button onclick="removeMember(\${idx})" class="text-slate-400 select-none hover:text-red-500">&times;</button></span>\`;
      });
      countEl.innerText = members.length + ' members';
      calculateSplit();
    }

    function addMember() {
      const input = document.getElementById('member-name');
      if (!input.value.trim()) return;
      members.push(input.value.trim());
      input.value = '';
      renderMembers();
    }

    function removeMember(idx) {
      if (members.length <= 1) {
        alert("Must maintain at least 1 member.");
        return;
      }
      members.splice(idx, 1);
      renderMembers();
    }

    function calculateSplit() {
      const amt = parseFloat(totalEl.value) || 0;
      const split = amt / (members.length || 1);
      perPersonEl.innerText = '$' + split.toFixed(2);
    }
  </script>
</body>
</html>`
  }
];

export interface CodeWorkspaceProps {
  onBackToChat: () => void;
}

export default function CodeWorkspace({ onBackToChat }: CodeWorkspaceProps) {
  // Saved API Keys
  const [keys, setKeys] = useState({
    gemini: '',
    openrouter: '',
    nvidia: ''
  });
  
  const [showConfig, setShowConfig] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // App playground state
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'preview' | 'code'>('preview');
  const [selectedModel, setSelectedModel] = useState('cohere-north-mini-code-free');
  const [activeModelProvider, setActiveModelProvider] = useState('openrouter');
  
  // Model filtration state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCost, setFilterCost] = useState<'all' | 'free' | 'paid'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'openrouter' | 'nvidia'>('all');
  const [filterCapability, setFilterCapability] = useState<'all' | 'coding' | 'reasoning' | 'image-to-text' | 'video-generation'>('all');
  const [filterModality, setFilterModality] = useState<'all' | 'text' | 'image' | 'audio' | 'video'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Custom chat history for this workspace
  const [workspaceLogs, setWorkspaceLogs] = useState<any[]>([
    { role: 'assistant', content: "Hello! Welcome to the **Interactive Code Studio**. Configure your keys or select a template below to build and preview live software.", timestamp: new Date().toLocaleTimeString() }
  ]);
  
  const { request, loading, error } = useAI();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load keys from localStorage on mount
  useEffect(() => {
    const loadedKeys = {
      gemini: localStorage.getItem('nexus_custom_gemini_key') || '',
      openrouter: localStorage.getItem('nexus_custom_openrouter_key') || '',
      nvidia: localStorage.getItem('nexus_custom_nvidia_key') || ''
    };
    setKeys(loadedKeys);
    
    // Set first template as initial code on mount
    setGeneratedCode(TEMPLATES[0].code);
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('nexus_custom_gemini_key', keys.gemini);
    localStorage.setItem('nexus_custom_openrouter_key', keys.openrouter);
    localStorage.setItem('nexus_custom_nvidia_key', keys.nvidia);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClearKeys = () => {
    localStorage.removeItem('nexus_custom_gemini_key');
    localStorage.removeItem('nexus_custom_openrouter_key');
    localStorage.removeItem('nexus_custom_nvidia_key');
    setKeys({ gemini: '', openrouter: '', nvidia: '' });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Compile full iframe HTML wrapper injecting cdn assets for high fidelity
  const getCompiledIframeSource = (rawCode: string) => {
    // If the raw code is already a complete HTML document, just return it
    if (rawCode.toLowerCase().includes('<!doctype html>') || rawCode.toLowerCase().includes('<html>')) {
      return rawCode;
    }
    
    // Otherwise wrap it beautifully in Tailwind and basic styles
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
      padding: 2rem; 
      margin: 0; 
      background-color: #f8fafc; 
      color: #0f172a;
    }
  </style>
</head>
<body>
  ${rawCode}
</body>
</html>`;
  };

  const handleLoadTemplate = (tpl: typeof TEMPLATES[0]) => {
    setGeneratedCode(tpl.code);
    setActiveWorkspaceTab('preview');
    setWorkspaceLogs(prev => [
      ...prev,
      { role: 'user', content: `Selected Template: ${tpl.name}`, timestamp: new Date().toLocaleTimeString() },
      { role: 'assistant', content: `Template **${tpl.name}** loaded successfully! Below is the visual representation. You can tweak its styles, values or add any features using the prompt field on the left.`, timestamp: new Date().toLocaleTimeString() }
    ]);
  };

  // Helper routine to extract code blocks from raw AI Markdown streams
  const extractCodeBlock = (text: string): string => {
    const regex = /```(?:html|xml|svg|javascript|typescript|css|jsx|tsx)?\n([\s\S]*?)```/gi;
    const matches = Array.from(text.matchAll(regex));
    
    if (matches.length > 0) {
      // Concatenate code blocks if multiple are found, or return the primary
      return matches.map(m => m[1].trim()).join('\n\n');
    }
    
    // If no markdown block but starts/ends with HTML, return directly
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.endsWith('>')) {
      return trimmed;
    }
    
    return "";
  };

  const executeCodeGeneration = async () => {
    if (!prompt.trim()) return;

    const userPrompt = prompt;
    setPrompt('');

    // Append to logs
    const newLogs = [
      ...workspaceLogs,
      { role: 'user', content: userPrompt, timestamp: new Date().toLocaleTimeString() }
    ];
    setWorkspaceLogs(newLogs);

    // Context instruction forcing coding specifications
    const systemPromptContext = `
      You are building an interactive standalone interface or widget using HTML, CSS, JavaScript or Tailwind.
      IMPORTANT:
      - ALWAYS return the COMPLETED code in a single, standard markdown code block: \`\`\`html\\n...\\n\`\`\`.
      - Write functional, beautiful, and complete layout. Do not write placeholder responses or comments inside the code block.
      - Ensure you provide premium styling (using Tailwind via script tag link if needed) and responsive elements.
      - If the user wants to refine previous code, integrate the changes directly into the full codebase and return the revised complete codebase in the markdown block.
      - Current existing code context:
      ${generatedCode}
    `;

    // Construct request history payload
    const payloadHistory = [
      { role: 'user', content: systemPromptContext + "\n\nUser request: " + userPrompt }
    ] as any;

    // Trigger AI request using useAI hook
    const response = await request(payloadHistory, {
      personality: 'coder',
      style: 'precise',
      length: 'long',
      dynamicRouting: false,
      modelMode: 'turbo'
    }, (partialContent) => {
      // Live feedback parsing
      const parsedCode = extractCodeBlock(partialContent);
      if (parsedCode) {
        setGeneratedCode(parsedCode);
      }
    }, selectedModel);

    if (response && response.content) {
      const finalCode = extractCodeBlock(response.content);
      if (finalCode) {
        setGeneratedCode(finalCode);
        setWorkspaceLogs(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: "Synthesized code block successfully updated. You can check the preview sandbox and code components directly.", 
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
      } else {
        setWorkspaceLogs(prev => [
          ...prev,
          { 
            role: 'assistant', 
            content: "Code generator updated. Note: Raw code could not be cleanly extracted into the canvas. Please copy directly from response:\n\n" + response.content, 
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert("Copied code to clipboard.");
  };

  const downloadFile = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-custom-workspace.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    
    // Find provider from standard model list
    const found = MODELS.find(m => m.id === modelId);
    if (found) {
      setActiveModelProvider(found.provider);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full bg-slate-50 relative overflow-hidden">
      {/* Configure Keys Button / Panel Toggle */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold leading-normal flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <Key className="w-4 h-4" />
          <span>My API Keys</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </button>
      </div>

      {/* Keys Config Drawer Panel overlay */}
      <AnimatePresence>
        {showConfig && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfig(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 pointer-events-auto"
            />
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-100 p-8 z-55 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight text-lg">My Custom Keys</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">Stored Client-Side in LocalStorage</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-slate-500 font-semibold uppercase tracking-wider">
                  Entering your own keys lets you use high-performance AI models directly. Your keys never leave this browser and are only proxied for your requested queries.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OpenRouter API Key</label>
                  <input 
                    type="password" 
                    value={keys.openrouter} 
                    onChange={e => setKeys({...keys, openrouter: e.target.value})}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Power Claude 3.5 Sonnet, GPT-4o, DeepSeek V3.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NVIDIA NIM API Key</label>
                  <input 
                    type="password" 
                    value={keys.nvidia} 
                    onChange={e => setKeys({...keys, nvidia: e.target.value})}
                    placeholder="nvapi-..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Power high-grade Nvidia hosted model reasoning.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={handleSaveKeys}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Save My Keys
                </button>
                <button 
                  onClick={handleClearKeys}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl transition"
                >
                  Clear Keys
                </button>
              </div>

              {isSaved && (
                <div className="mt-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Key state updated successfully.
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: Prompt Workspace & Logs */}
      <div className="w-full lg:w-[420px] bg-white border-r border-slate-100 flex flex-col h-full shrink-0">
        {/* Header toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 w-fit bg-slate-950 text-indigo-400 rounded-lg">
              <Terminal className="w-4 h-4 shadow-inner" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 tracking-tight text-md">Coding Synapse</h2>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">WORKSPACE MODE</p>
            </div>
          </div>
          <button 
            onClick={onBackToChat}
            className="text-xs font-bold text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 px-3 py-1.5 rounded-lg transition"
          >
            ← Back to Chat
          </button>
        </div>

        {/* Workspace Logging lists */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {workspaceLogs.map((log, i) => (
            <div key={i} className={`flex flex-col gap-1 max-w-[90%] ${log.role === 'user' ? 'ml-auto border-r-2 border-indigo-500 pr-3 items-end' : 'border-l-2 border-slate-200 pl-3'}`}>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{log.role === 'user' ? 'Me' : 'System AI'}</span>
                <span className="text-[8px] font-medium text-slate-300">{log.timestamp}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 font-semibold whitespace-pre-wrap">{log.content}</p>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Compiling code blocks...</span>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-600 leading-normal">
              Error detected: {error}. Click My API Keys above to check configuration state.
            </div>
          )}
        </div>

        {/* Quick templates loader drawer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
          {TEMPLATES.map((tpl, idx) => (
            <button 
              key={idx}
              onClick={() => handleLoadTemplate(tpl)}
              className="px-3.5 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-xl text-[11px] font-bold inline-flex items-center gap-2 transition active:scale-95 shrink-0 shadow-sm cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {tpl.name}
            </button>
          ))}
        </div>

        {/* Action Prompt Pad */}
        <div className="p-5 border-t border-slate-100">
          <div className="relative">
            <textarea 
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  executeCodeGeneration();
                }
              }}
              placeholder="Describe layout changes or new features (e.g., Make the background dark mode)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 leading-relaxed resize-none"
            />
            <button 
              onClick={executeCodeGeneration}
              disabled={loading || !prompt.trim()}
              className="absolute right-3.5 bottom-4 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl transition shadow shadow-indigo-200 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Code View / Playground */}
      <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
        {/* Toggle between preview and code source */}
        <div className="h-14 border-b border-slate-200/50 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button 
              onClick={() => setActiveWorkspaceTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeWorkspaceTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
            <button 
              onClick={() => setActiveWorkspaceTab('code')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeWorkspaceTab === 'code' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Source HTML
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={copyToClipboard}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl transition shadow-sm hover:text-indigo-600"
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={downloadFile}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-xl transition shadow-sm hover:text-indigo-600"
              title="Download Bundle"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 relative bg-white m-4 rounded-[2rem] border border-slate-200/50 overflow-hidden shadow-sm">
          {activeWorkspaceTab === 'preview' ? (
            <iframe 
              ref={iframeRef}
              title="Interactive UI Sandbox"
              srcDoc={getCompiledIframeSource(generatedCode)}
              className="w-full h-full bg-white relative z-10"
              sandbox="allow-scripts allow-popups allow-pointer-lock allow-forms"
            />
          ) : (
            <div className="w-full h-full bg-slate-950 font-mono text-xs text-slate-300 p-8 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-800 pb-4 mb-4 uppercase tracking-wider select-none shrink-0 font-bold">
                <span>nexus-renderer.html</span>
                <span>UTF-8 Codebase</span>
              </div>
              <pre className="flex-1 whitespace-pre-wrap select-text leading-relaxed font-semibold">
                <code>{generatedCode || "<!-- Code base is currently empty. Ask the AI to write elements! -->"}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
