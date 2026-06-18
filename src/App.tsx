import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Zap,
  Shield,
  Send,
  Sparkles,
  Command,
  FileText,
  Lightbulb,
  LogOut,
  User as UserIcon,
  Clock,
  Trash2,
  Menu,
  X,
  Presentation,
  Code,
  Settings,
  Paperclip,
  File,
  Image as ImageIcon,
  Film,
  Check,
  Layers,
  Cpu,
  History,
  User,
  Mail,
  Globe,
  Palette,
  Activity,
  Terminal,
  Lock,
  Monitor,
  Smartphone,
  Volume2,
  Mic,
  Key,
  Eye,
  EyeOff,
  Gauge,
  Info,
  Sliders,
  Github,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAI, Message, MODELS, NexusSettings } from './lib/ai';
import CodeWorkspace from './components/CodeWorkspace';
import { auth, signInWithGoogle, signInWithGithub } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { saveChat, getChats, deleteChat } from './lib/db';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // App States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');

  // Custom client-side purpose-to-model configuration
  const [purposeMapping, setPurposeMapping] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem('nexus_custom_purpose_mapping');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return {
      'Coding': 'qwen-3-coder-free-code',
      'Reasoning / Math': 'deepseek-r1-free-reasoning',
      'General Chat': 'gemma-3-27b-it-free-general',
      'File Analysis': 'qwen3-next-thinking-free-file',
      'Image Analysis': 'qwen-vl-free-image',
      'Video Analysis': 'nemotron-3-nano-omni-free-video',
      'Agents / Workflows': 'deepseek-v3-free-agent'
    };
  });

  const [customOpenRouterKey, setCustomOpenRouterKey] = useState(() => localStorage.getItem('nexus_custom_openrouter_key') || '');
  const [customNvidiaKey, setCustomNvidiaKey] = useState(() => localStorage.getItem('nexus_custom_nvidia_key') || '');

  // Synchronize router settings to cache
  useEffect(() => {
    localStorage.setItem('nexus_custom_purpose_mapping', JSON.stringify(purposeMapping));
  }, [purposeMapping]);

  useEffect(() => {
    localStorage.setItem('nexus_custom_openrouter_key', customOpenRouterKey);
  }, [customOpenRouterKey]);

  useEffect(() => {
    localStorage.setItem('nexus_custom_nvidia_key', customNvidiaKey);
  }, [customNvidiaKey]);

  const [nexusSettings, setNexusSettings] = useState<NexusSettings>({
    personality: 'assistant',
    style: 'balanced',
    length: 'medium',
    dynamicRouting: true,
    modelMode: 'turbo'
  });
  
  const { request, loading, error } = useAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) loadUserLibrary();
    });
    return unsubscribe;
  }, []);

  const loadUserLibrary = async () => {
    try {
      const chats = await getChats();
      setSavedChats(chats);
    } catch (e) {
      console.error("Library load error:", e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        let type: 'image' | 'video' | 'audio' | 'file' = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        
        setAttachments(prev => [...prev, {
          type,
          url: ev.target?.result as string,
          name: file.name,
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() && attachments.length === 0) return;

    const currentInput = userInput;
    const currentAttachments = [...attachments];
    setUserInput("");
    setAttachments([]);

    const newUserMsg: Message = { 
      role: 'user', 
      content: currentInput || (currentAttachments.length > 0 ? "Analyze attached media" : ""),
      attachments: currentAttachments 
    };
    
    const updatedHistory = [...history, newUserMsg];
    setHistory(updatedHistory);

    // Initial placeholder for assistant response
    const assistantPlaceholder: Message = { role: 'assistant', content: "", model: 'Nexus Auto' };
    setHistory(prev => [...prev, assistantPlaceholder]);

    const resp = await request(updatedHistory, nexusSettings, (content) => {
      setHistory(prev => {
        const newHistory = [...prev];
        const lastMsg = newHistory[newHistory.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = content;
        }
        return newHistory;
      });
    }, selectedModelId === 'nvidia-nemotron-3-super-free' ? undefined : selectedModelId);

    if (resp && user) {
      const finalHistory = [...updatedHistory, { role: 'assistant', content: resp.content, model: resp.model }];
      const title = history.length === 0 ? (currentInput || "Media Session").substring(0, 30) : undefined;
      const id = await saveChat(currentChatId, finalHistory, title);
      if (id) setCurrentChatId(id);
      loadUserLibrary();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChat(id);
    if (currentChatId === id) {
      setHistory([]);
      setCurrentChatId(null);
    }
    loadUserLibrary();
  };

  const startNewChat = () => {
    setHistory([]);
    setCurrentChatId(null);
    setAttachments([]);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Nexus Link Establishing...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center relative z-10"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center mb-8 mx-auto rotate-12">
            <Sparkles className="w-10 h-10 text-white -rotate-12" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-2 font-display tracking-tight">Nexus</h1>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed max-w-[280px] mx-auto">
            Experience the next generation of unified intelligence.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  if (err.code === 'auth/account-exists-with-different-credential') {
                    setAuthError("An account already exists with this email. Please use the provider you originally signed up with.");
                  } else if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
                    setAuthError("Failed to authenticate with Google. Please try again.");
                  }
                }
              }}
              className="w-full bg-white text-slate-900 border border-slate-200 rounded-2xl py-4 flex items-center justify-center gap-4 font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-50 group-hover:opacity-100" alt="Google" />
              Sign in with Google
            </button>
            <button 
              onClick={async () => {
                setAuthError(null);
                try {
                  await signInWithGithub();
                } catch (err: any) {
                  if (err.code === 'auth/account-exists-with-different-credential') {
                    setAuthError("An account already exists with this email. Please use the provider you originally signed up with (likely Google).");
                  } else if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
                    setAuthError("Failed to authenticate with GitHub. Please try again.");
                  }
                }
              }}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 flex items-center justify-center gap-4 font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </button>
          </div>

          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-600 leading-relaxed"
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Neural Interface</p>
        </motion.div>
      </div>
    );
  }

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 font-sans overflow-hidden">
      {/* Navigation Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="h-full bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden whitespace-nowrap z-20"
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 px-2 mb-4">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5 shadow-sm" />
             </div>
             <span className="font-black text-xl tracking-tighter">Nexus</span>
          </div>
        </div>

        <div className="px-5 mb-6 flex flex-col gap-2">
          <button onClick={startNewChat} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95">
            <Plus className="w-4 h-4 text-indigo-600" />
            New Link
          </button>

          <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-xl gap-1 mt-2 select-none">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold leading-none transition-all cursor-pointer",
                activeTab === 'chat' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat Studio
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={cn(
                "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold leading-none transition-all cursor-pointer",
                activeTab === 'code' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Terminal className="w-3.5 h-3.5" />
              Code Space
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">
          <div className="pt-2">
            <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">History</h4>
            <div className="space-y-0.5">
              {savedChats.length === 0 ? (
                <div className="px-3 py-4 text-xs font-semibold text-slate-400 italic">No previous streams</div>
              ) : (
                savedChats.map(c => (
                  <div key={c.id} className="group relative px-1">
                    <button 
                      onClick={() => { setHistory(c.messages); setCurrentChatId(c.id); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left truncate transition-all",
                        currentChatId === c.id ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-500 hover:bg-slate-200/50"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-40" />
                      <span className="truncate">{c.title || "Untitled Stream"}</span>
                    </button>
                    <button onClick={(e) => handleDeleteChat(c.id, e)} className="absolute right-3 top-2.5 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
           <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-8 h-8 rounded-lg" alt="P" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || user.email}</p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Link Active</span>
                </div>
              </div>
           </div>
           <div className="flex gap-1">
              <button onClick={() => setSettingsOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition-all">
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
              <button onClick={() => signOut(auth)} className="aspect-square flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                <LogOut className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>
      </motion.aside>

      {/* Main Experience */}
      {activeTab === 'code' ? (
        <CodeWorkspace onBackToChat={() => setActiveTab('chat')} />
      ) : (
        <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="h-14 flex items-center px-6 border-b border-slate-100 justify-between bg-white/80 backdrop-blur-md z-10">
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="h-6 w-px bg-slate-200" />
              
              {/* Model Selector Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                   <Zap className={cn("w-3.5 h-3.5", selectedModelId === 'nvidia-nemotron-3-super-free' ? "text-indigo-500 fill-indigo-500" : "text-slate-400")} />
                   <span className="text-xs font-bold text-slate-700">{selectedModel?.name}</span>
                   <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-[480px] overflow-y-auto custom-scrollbar">
                  {Object.entries(
                    MODELS.reduce<Record<string, typeof MODELS>>((acc, m) => {
                      const cat = m.category || 'General';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(m);
                      return acc;
                    }, {})
                  ).map(([category, models]) => (
                    <div key={category} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-black tracking-wider text-slate-400 uppercase select-none border-b border-slate-55 mb-1.5">
                        {category === 'Adaptive' && '⚡ Adaptive Neural Routing'}
                        {category === 'Coding' && '💻 Coding Models'}
                        {category === 'Reasoning / Math' && '🧠 Reasoning & Math'}
                        {category === 'General Chat' && '💬 General Chat'}
                        {category === 'File Analysis' && '📄 File Analysis'}
                        {category === 'Image Analysis' && '🖼️ Image Analysis'}
                        {category === 'Video Analysis' && '🎥 Video Analysis'}
                        {category === 'Agents / Workflows' && '🤖 Agents & Workflows'}
                        {category === 'Top 10 Free Models' && '⭐ Top 10 Free OpenRouter Models'}
                      </div>
                      <div className="space-y-0.5">
                        {models.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => setSelectedModelId(m.id)}
                            className={cn(
                              "w-full flex flex-col p-2.5 rounded-xl text-left transition-all",
                              selectedModelId === m.id ? "bg-indigo-50 border border-indigo-100/50" : "hover:bg-slate-50 border border-transparent"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 w-full mb-0.5">
                              <span className="text-xs font-bold text-slate-900">{m.name}</span>
                              {selectedModelId === m.id ? (
                                <Check className="w-3 h-3 text-indigo-600 shrink-0" />
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{m.provider}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight">{m.description}</p>
                            {m.why && (
                              <div className="text-[9px] font-semibold text-indigo-700 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 mt-1 self-start leading-none select-none">
                                <span className="text-[8px] uppercase tracking-wider text-indigo-400 font-extrabold header-why">Why:</span>
                                <span>{m.why}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold">SM</div>
                  <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">NX</div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar pt-10">
                   {history.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
                        <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-[32px] flex items-center justify-center text-indigo-600 mb-8 shadow-inner animate-pulse">
                           <Sparkles className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 mb-4 font-display tracking-tight">System Ready</h2>
                        <p className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-[10px] mb-12">Nexus Intelligence Cluster Integrated</p>
                        <div className="grid grid-cols-2 gap-3 w-full">
                           <SuggestionCard icon={<FileText className="w-4 h-4"/>} text="Synthesize a project brief" onClick={() => setUserInput("Synthesize a comprehensive project brief for a high-performance EV startup.")} />
                           <SuggestionCard icon={<Presentation className="w-4 h-4"/>} text="Analyze market patterns" onClick={() => setUserInput("Analyze current market patterns for decentralized energy storage.")} />
                           <SuggestionCard icon={<Code className="w-4 h-4"/>} text="Generate logic hooks" onClick={() => setUserInput("Generate custom React logic hooks for advanced state hydration.")} />
                           <SuggestionCard icon={<Lightbulb className="w-4 h-4"/>} text="Creative Ideation" onClick={() => setUserInput("Surface 5 high-impact creative directions for a minimalist sustainable brand.")} />
                        </div>
                     </div>
                   ) : (
                     <div className="pb-40">
                        {history.map((msg, i) => (
                           <div key={i} className={cn("animate-msg", msg.role === 'assistant' ? "bubble-assistant" : "bubble-user")}>
                              <div className={msg.role === 'assistant' ? "avatar-ai" : "avatar-user"}>
                                 {msg.role === 'assistant' ? <Sparkles className="w-4 h-4 shadow-sm" /> : <UserIcon className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 flex flex-col gap-2">
                                <div className="text-[16px] leading-[1.7] text-slate-700 font-medium whitespace-pre-wrap pt-0.5">
                                   {msg.role === 'assistant' ? (
                                      <div className="prose prose-slate max-w-none prose-sm sm:prose-base dark:prose-invert">
                                         <ReactMarkdown 
                                            remarkPlugins={[remarkMath]} 
                                            rehypePlugins={[rehypeHighlight, rehypeKatex]}
                                         >
                                            {msg.content}
                                         </ReactMarkdown>
                                      </div>
                                   ) : (
                                      <div>
                                        <span>{msg.content}</span>
                                        {msg.attachments && msg.attachments.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-4">
                                            {msg.attachments.map((att, idx) => (
                                              <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/20 shadow-lg">
                                                {att.type === 'image' ? (
                                                  <img src={att.url} className="w-32 h-32 object-cover" alt="attachment" />
                                                ) : att.type === 'video' ? (
                                                  <div className="w-32 h-32 bg-slate-800 flex items-center justify-center relative">
                                                    <Film className="w-8 h-8 text-white/20" />
                                                    <span className="absolute bottom-2 right-2 text-[8px] font-bold text-white/50 uppercase tracking-widest">Video Link</span>
                                                  </div>
                                                ) : att.type === 'audio' ? (
                                                  <div className="w-32 h-12 bg-slate-100 flex items-center gap-3 px-4 rounded-xl border border-slate-200">
                                                    <Volume2 className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-[9px] font-bold text-slate-500 truncate">{att.name}</span>
                                                  </div>
                                                ) : (
                                                  <div className="w-32 h-32 bg-slate-800 flex items-center justify-center p-4 text-[10px] text-white/50 break-all">{att.name}</div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                   )}
                                </div>
                                {msg.role === 'assistant' && msg.model && (
                                  <div className="flex items-center gap-1.5 opacity-40">
                                    <div className="w-1 h-1 rounded-full bg-slate-400" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                      {MODELS.find(m => m.id === msg.model)?.name || msg.model}
                                    </span>
                                  </div>
                                )}
                              </div>
                           </div>
                        ))}
                        {loading && (
                          <div className="bubble-assistant">
                             <div className="avatar-ai"><Sparkles className="w-4 h-4" /></div>
                             <div className="flex gap-1.5 items-center h-8">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_8px_#818cf8]" />
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_8px_#818cf8]" />
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_8px_#818cf8]" />
                             </div>
                          </div>
                        )}
                        {error && (
                          <div className="flex items-start gap-3 p-4 mx-6 my-2 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-2xl text-xs font-semibold max-w-[85%] self-start">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                            <div className="flex flex-col gap-1">
                              <span className="font-black tracking-wider uppercase text-[10px] text-rose-600">Sync Error</span>
                              <span className="font-semibold">{error === "TOO HIGH FOR YOUR PLAN" ? "TOO HIGH FOR YOUR PLAN" : error}</span>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                     </div>
                   )}
                </div>

                <div className="p-4 bg-gradient-to-t from-white via-white to-transparent sticky bottom-0">
                   <div className="chat-input-wrapper overflow-visible">
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 px-2">
                           {attachments.map((file, i) => (
                             <motion.div 
                               initial={{ opacity: 0, scale: 0.9 }}
                               animate={{ opacity: 1, scale: 1 }}
                               key={i} 
                               className="relative group w-14 h-14 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                             >
                               {file.type === 'image' ? (
                                 <img src={file.url} className="w-full h-full object-cover" alt="p" />
                               ) : file.type === 'video' ? (
                                 <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                    <Film className="w-5 h-5 text-indigo-400" />
                                 </div>
                               ) : file.type === 'audio' ? (
                                 <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                    <Volume2 className="w-5 h-5 text-indigo-400" />
                                 </div>
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center p-1">
                                    <File className="w-5 h-5 text-slate-300" />
                                 </div>
                               )}
                               <button onClick={() => removeAttachment(i)} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <X className="w-4 h-4" />
                               </button>
                             </motion.div>
                           ))}
                        </div>
                      )}
                      
                      <div className="relative group">
                        <textarea 
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={`Message ${selectedModel?.name}...`}
                          rows={1}
                          className="chat-input !pl-14"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute left-3 bottom-2.5 p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                        <button 
                          onClick={handleSendMessage}
                          disabled={loading || (!userInput.trim() && attachments.length === 0)}
                          className="absolute right-3 bottom-2.5 p-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90 disabled:opacity-30 disabled:grayscale"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="mt-4 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest italic flex items-center justify-center gap-2">
                        <Shield className="w-3 h-3" />
                         Encrypted Link • {selectedModel?.name} Active
                      </p>
                   </div>
                </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSettingsOpen(false)}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col h-[85vh]"
             >
                <div className="flex h-full overflow-hidden">
                   {/* Settings Sidebar */}
                   <div className="w-64 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-6 overflow-y-auto">
                      <div className="mb-4">
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Nexus Core</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">v3.12-ALPHA</p>
                      </div>
                      
                      <div className="space-y-1">
                         <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Configuration</p>
                         <SettingsTab active={activeSettingsTab === 'general'} onClick={() => setActiveSettingsTab('general')} icon={<UserIcon className="w-4 h-4"/>} label="General" />
                         <SettingsTab active={activeSettingsTab === 'memory'} onClick={() => setActiveSettingsTab('memory')} icon={<History className="w-4 h-4"/>} label="Memory" />
                      </div>

                      <div className="space-y-1">
                         <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">System Center</p>
                         <SettingsTab active={activeSettingsTab === 'routing'} onClick={() => setActiveSettingsTab('routing')} icon={<Key className="w-4 h-4"/>} label="API Keys & Routing" />
                         <SettingsTab active={activeSettingsTab === 'security'} onClick={() => setActiveSettingsTab('security')} icon={<Shield className="w-4 h-4"/>} label="Security Core" />
                      </div>

                      <div className="mt-auto pt-6">
                         <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-bold">
                            <LogOut className="w-4 h-4"/>
                            Terminate Link
                         </button>
                      </div>
                   </div>

                   {/* Settings Content */}
                   <div className="flex-1 flex flex-col bg-white overflow-hidden">
                      <header className="p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md">
                         <div>
                            <h2 className="text-2xl font-black text-slate-900 capitalize italic">{activeSettingsTab.replace('_', ' ')}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nexus Intelligence Parameters</p>
                         </div>
                         <button onClick={() => setSettingsOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all hover:scale-110">
                            <X className="w-6 h-6" />
                         </button>
                      </header>

                      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                         {activeSettingsTab === 'general' && (
                           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <div className="flex items-center gap-6">
                                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-20 h-20 rounded-[2rem] shadow-xl border-4 border-white" alt="Avatar"/>
                                <div>
                                   <h4 className="text-xl font-black text-slate-900">{user.displayName || 'Nexus User'}</h4>
                                   <p className="text-sm font-medium text-slate-400">{user.email}</p>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <InputGroup label="Display Username" value={user.displayName || ''} disabled={true}/>
                                <InputGroup label="Neural ID (Email)" value={user.email || ''} disabled={true}/>
                                <SelectGroup 
                                   label="Primary Language" 
                                   options={['English', 'Spanish', 'French', 'German', 'Japanese', 'Hindi']} 
                                   defaultValue="English"
                                />
                                <SelectGroup 
                                   label="Interface Timezone" 
                                   options={['UTC', 'PST', 'EST', 'GMT', 'IST']} 
                                   defaultValue="IST"
                                />
                             </div>
                           </div>
                         )}

                         {false && (
                           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <div className="p-8 bg-indigo-600 rounded-[32px] text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                                   <Zap className="w-48 h-48" />
                                </div>
                                <div className="relative z-10">
                                   <h4 className="text-3xl font-black mb-3">Nexus Auto</h4>
                                   <p className="text-indigo-100 text-sm font-medium max-w-sm leading-relaxed mb-6">
                                      Nexus Auto adapts following high-speed reasoning, deep creativity, and biological-like patterns to ensure optimal output.
                                   </p>
                                   <div className="flex flex-wrap gap-4">
                                      {['turbo', 'deep_think', 'creative', 'quantum_qwen'].map(m => (
                                        <button 
                                          key={m}
                                          onClick={() => setNexusSettings(prev => ({ ...prev, modelMode: m as any }))}
                                          className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            nexusSettings.modelMode === m ? "bg-white text-indigo-600 shadow-xl" : "bg-indigo-500/50 hover:bg-indigo-500"
                                          )}
                                        >
                                          {m.replace('_', ' ')}
                                        </button>
                                      ))}
                                   </div>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Personality</h5>
                                   <div className="grid grid-cols-2 gap-3">
                                      {['assistant', 'coder', 'teacher', 'researcher', 'friendly', 'professional'].map(p => (
                                        <button 
                                          key={p}
                                          onClick={() => setNexusSettings(prev => ({ ...prev, personality: p as any }))}
                                          className={cn(
                                            "px-4 py-3 rounded-2xl border text-xs font-bold transition-all text-left",
                                            nexusSettings.personality === p ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                                          )}
                                        >
                                          {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                      ))}
                                   </div>
                                </div>

                                <div className="space-y-8">
                                   <RadioGroup 
                                      label="Response Style" 
                                      options={['precise', 'balanced', 'creative']} 
                                      value={nexusSettings.style}
                                      onChange={(v) => setNexusSettings(prev => ({ ...prev, style: v as any }))}
                                   />
                                   <RadioGroup 
                                      label="Response Length" 
                                      options={['short', 'medium', 'long']} 
                                      value={nexusSettings.length}
                                      onChange={(v) => setNexusSettings(prev => ({ ...prev, length: v as any }))}
                                   />
                                </div>
                             </div>
                           </div>
                         )}

                         {activeSettingsTab === 'memory' && (
                           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <ToggleGroup icon={<History />} label="Cognitive Retention" description="Allow Nexus to recall context from previous messages in this session." enabled={true} />
                             <ToggleGroup icon={<Lock />} label="Ephemeral Session" description="Discard all context immediately after link termination." enabled={false} />
                             <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Conversation Depth</p>
                                <div className="relative h-2 w-full bg-slate-200 rounded-full">
                                   <div className="absolute left-0 top-0 h-full w-[60%] bg-indigo-600 rounded-full" />
                                   <div className="absolute left-[60%] -translate-x-1/2 -top-2 w-6 h-6 bg-white border-4 border-indigo-600 rounded-full shadow-lg" />
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                   <span className="text-[10px] font-bold text-slate-400">SURFACE</span>
                                   <span className="text-[10px] font-bold text-slate-600">DEEP (60 Tokens)</span>
                                   <span className="text-[10px] font-bold text-slate-400">INFINITE</span>
                                </div>
                             </div>
                             <button className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                                Wipe All Neural Memory
                             </button>
                           </div>
                         )}

                         {activeSettingsTab === 'routing' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 p-2 text-slate-800">
                              {/* Notice Bar */}
                              <div className="p-8 bg-amber-50 border border-amber-200 rounded-[32px] text-amber-900 space-y-3">
                                 <div className="flex items-center gap-3">
                                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                                    <h4 className="text-sm font-black tracking-tight uppercase">User Connection mode active</h4>
                                 </div>
                                 <p className="text-xs font-medium text-amber-800 leading-relaxed">
                                    This workspace operates on a <strong>user-powered configuration</strong>. Backend developer keys are not provided. You must input your personal keys below to chat or write code.
                                 </p>
                              </div>

                              {/* Connect Keys Box */}
                              <div className="space-y-6">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Credentials Config</h5>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                       <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OpenRouter API Key ID</label>
                                          <span className="text-[8px] font-bold text-indigo-500 uppercase">Llama Prompt Routing</span>
                                       </div>
                                       <input 
                                          type="password" 
                                          placeholder="sk-or-v1-..."
                                          value={customOpenRouterKey}
                                          onChange={(e) => setCustomOpenRouterKey(e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-inner"
                                       />
                                    </div>

                                    <div className="space-y-2">
                                       <div className="flex items-center justify-between">
                                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">NVIDIA GPU NIM API Key</label>
                                          <span className="text-[8px] font-bold text-indigo-500 uppercase">GPU Code Acceleration</span>
                                       </div>
                                       <input 
                                          type="password" 
                                          placeholder="nvapi-..."
                                          value={customNvidiaKey}
                                          onChange={(e) => setCustomNvidiaKey(e.target.value)}
                                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 shadow-inner"
                                       />
                                    </div>
                                 </div>
                              </div>

                              {/* Target Selection Box */}
                              <div className="space-y-6">
                                 <div>
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose-to-Model Routing Assignment</h5>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Nexus Adaptive routes prompts dynamically using these target assignments</p>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[36px] border border-slate-100">
                                    {Object.keys(purposeMapping).map((purpose) => {
                                       const filteredModels = MODELS;
                                       return (
                                          <div key={purpose} className="space-y-2">
                                             <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                                {purpose} Engine
                                             </label>
                                             <div className="relative">
                                                <select 
                                                   value={purposeMapping[purpose] || ''} 
                                                   onChange={(e) => setPurposeMapping(prev => ({ ...prev, [purpose]: e.target.value }))}
                                                   className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                                >
                                                   {filteredModels.map(m => (
                                                      <option key={m.id} value={m.id}>
                                                         {m.name} [{m.provider.toUpperCase()} - {m.costType?.toUpperCase() || 'FREE'}]
                                                      </option>
                                                   ))}
                                                </select>
                                                <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                            </div>
                          )}

                         {false && (
                           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="p-6 bg-slate-50 border border-slate-200 rounded-[32px] space-y-4">
                                    <div className="flex items-center justify-between">
                                       <Monitor className="w-5 h-5 text-slate-400" />
                                       <span className="text-[9px] font-black text-indigo-600 uppercase">Active</span>
                                    </div>
                                    <h4 className="text-sm font-black">Light Interface</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Clean, biological daylight aesthetics.</p>
                                 </div>
                                 <div className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] space-y-4">
                                    <h4 className="text-sm font-black text-white">Neural Dark</h4>
                                    <p className="text-[10px] text-slate-500 font-medium">High contrast for deep focus sessions.</p>
                                 </div>
                              </div>
                              <div className="space-y-6">
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accent Configuration</h5>
                                 <div className="flex gap-4">
                                    {['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'].map(c => (
                                      <button key={c} style={{ backgroundColor: c }} className="w-10 h-10 rounded-full shadow-lg ring-2 ring-transparent hover:ring-slate-300 transition-all"/>
                                    ))}
                                 </div>
                              </div>
                              <ToggleGroup icon={<Sparkles />} label="Frost Glass Effects" description="Enable blur and glassmorphism across the interface." enabled={true} />
                              <ToggleGroup icon={<Zap />} label="High Energy Animations" description="Dynamic transitions and micro-motion feedback." enabled={true} />
                           </div>
                         )}

                         {false && (
                           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                             <div className="grid grid-cols-3 gap-6">
                                <StatCard label="Total Messages" value="1,284" sub="Last 30 days" />
                                <StatCard label="Tokens Processed" value="482k" sub="Nexus Link v3" />
                                <StatCard label="Avg Response" value="1.4s" sub="Sub-neural speed" />
                             </div>
                             <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-200 h-64 flex items-end gap-2 px-8">
                                {[40, 70, 45, 90, 65, 80, 100, 55, 75, 60, 85, 40].map((h, i) => (
                                  <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-indigo-500 rounded-t-lg opacity-40 hover:opacity-100 transition-all" />
                                ))}
                             </div>
                           </div>
                         )}

                         {activeSettingsTab === 'security' && (
                           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                              <div className="p-10 bg-emerald-50 border border-emerald-100 rounded-[32px] flex items-center gap-6">
                                 <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <Shield className="w-8 h-8" />
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-black text-emerald-900 uppercase italic">Biological Encryption Active</h4>
                                    <p className="text-sm font-medium text-emerald-700">All data is end-to-end encrypted with post-quantum logic.</p>
                                 </div>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                 <button className="flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-[28px] transition-all">
                                    <div className="flex items-center gap-4 text-left">
                                       <Key className="w-5 h-5 text-slate-400" />
                                       <div>
                                          <p className="text-sm font-black">Passkey Lifecycle</p>
                                          <p className="text-[10px] text-slate-400 font-medium">Rotation every 90 planetary cycles</p>
                                       </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                 </button>
                                 <button className="flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-[28px] transition-all">
                                    <div className="flex items-center gap-4 text-left">
                                       <Shield className="w-5 h-5 text-slate-400" />
                                       <div>
                                          <p className="text-sm font-black">Two-Factor Authentication</p>
                                          <p className="text-[10px] text-slate-400 font-medium">Neural biometric link verified</p>
                                       </div>
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase px-3 py-1 bg-emerald-100 rounded-full">ENABLED</span>
                                 </button>
                              </div>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all",
        active ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100" : "text-slate-500 hover:bg-slate-200/50"
      )}
    >
      <div className={cn("transition-colors", active ? "text-indigo-600" : "text-slate-400")}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function InputGroup({ label, value, disabled }: { label: string, value: string, disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type="text" 
        defaultValue={value} 
        disabled={disabled}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 disabled:opacity-50"
      />
    </div>
  );
}

function SelectGroup({ label, options, defaultValue }: { label: string, options: string[], defaultValue: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <select defaultValue={defaultValue} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-600/20">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronRight className="w-4 h-4 text-slate-400 absolute right-5 top-1/2 -translate-y-1/2 rotate-90" />
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
        {options.map(o => (
          <button 
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              value === o ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:bg-white/50"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleGroup({ icon, label, description, enabled }: { icon: React.ReactNode, label: string, description: string, enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[40px] border border-slate-200">
       <div className="flex items-center gap-6 text-left">
          <div className="p-4 bg-white rounded-2xl text-slate-400 shadow-sm">
             {icon}
          </div>
          <div>
             <p className="text-md font-black text-slate-900">{label}</p>
             <p className="text-xs font-medium text-slate-400">{description}</p>
          </div>
       </div>
       <div className={cn(
         "w-14 h-8 rounded-full relative p-1.5 shadow-inner transition-colors duration-300",
         enabled ? "bg-indigo-600" : "bg-slate-300"
       )}>
          <div className={cn(
            "w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300",
            enabled ? "ml-auto" : "ml-0"
          )} />
       </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[32px] text-center space-y-2">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{value}</p>
       <p className="text-[10px] font-bold text-indigo-600/50 uppercase">{sub}</p>
    </div>
  );
}

function SuggestionCard({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-6 border border-slate-200 rounded-[24px] text-left hover:border-indigo-200 hover:bg-indigo-50/10 transition-all group flex flex-col gap-4 bg-white shadow-sm hover:shadow-md"
    >
      <div className="p-2.5 w-fit bg-slate-50 text-slate-400 rounded-xl group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">{text}</p>
    </button>
  );
}
