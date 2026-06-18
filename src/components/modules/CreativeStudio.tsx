import React from 'react';
import { Palette, Download, Sparkles, Wand2, Type, Image as ImageIcon, RotateCcw, Share2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  imageUrl: string | null;
  isGenerating: boolean;
}

const CreativeStudio: React.FC<Props> = ({ prompt, onPromptChange, onGenerate, imageUrl, isGenerating }) => {
  const downloadImage = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-[48px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 transition-all duration-700">
      <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[28px] bg-slate-50 text-indigo-600 shadow-sm">
            <Palette className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter">Art Studio</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Neural Content Generation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {imageUrl && (
            <button
                onClick={downloadImage}
                className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[13px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 active:scale-95"
            >
                <Download className="w-4 h-4" />
                Raw Download
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Controls */}
        <div className="w-[420px] p-12 border-r border-slate-50 flex flex-col gap-10 bg-slate-50/20 overflow-y-auto custom-scrollbar">
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                 <Type className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest font-mono">Prompt Engineering</span>
              </div>
              <textarea 
                value={prompt}
                onChange={e => onPromptChange(e.target.value)}
                placeholder="Describe a cinematic scene, digital portrait, or abstract concept..."
                className="w-full h-48 p-8 bg-white border border-slate-100 rounded-[40px] text-[15px] font-bold outline-none focus:ring-[12px] focus:ring-indigo-50 focus:border-indigo-400 transition-all shadow-sm resize-none leading-relaxed text-slate-700"
              />
           </div>

           <div className="space-y-8">
              <div className="flex items-center gap-3 text-slate-400">
                 <Layers className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest font-mono">System Parameters</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <ParamCard label="Engine" value="SDXL-V3" />
                  <ParamCard label="Aspect" value="1:1" />
                  <ParamCard label="Fidelity" value="Lossless" />
                  <ParamCard label="Lighting" value="Volumetric" />
              </div>
           </div>

           <div className="mt-auto pt-10">
              <button 
                onClick={onGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-base flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Manifest Art
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Output Stage */}
        <div className="flex-1 p-12 bg-white flex flex-col">
          <AnimatePresence mode="wait">
            {imageUrl ? (
              <motion.div 
                key="image"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col gap-10"
              >
                 <div className="flex-1 relative group cursor-crosshair overflow-hidden rounded-[56px] shadow-2xl shadow-slate-200">
                    <img src={imageUrl} alt="Result" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-12">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[32px] w-full flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ImageIcon className="w-6 h-6 text-white" />
                                <span className="text-white font-bold tracking-tight">Render Complete</span>
                            </div>
                            <div className="flex gap-4">
                               <button className="p-3 bg-white/20 rounded-2xl hover:bg-white text-white hover:text-slate-900 transition-all"><Share2 className="w-5 h-5" /></button>
                               <button onClick={onGenerate} className="p-3 bg-white/20 rounded-2xl hover:bg-white text-white hover:text-slate-900 transition-all"><RotateCcw className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between px-6 opacity-30">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">Blockchain Timestamp Logged</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">Resolution: 1024x1024</span>
                 </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 animate-float">
                 <div className="w-32 h-32 bg-slate-50 rounded-[48px] border border-slate-100 shadow-sm flex items-center justify-center text-slate-200 mb-10 ring-12 ring-slate-50/50">
                    <Palette className="w-16 h-16" />
                 </div>
                 <h4 className="text-3xl font-black text-slate-300 tracking-tighter mb-4 opacity-40">Creative Stage Neutral</h4>
                 <p className="text-sm font-bold text-slate-300 uppercase tracking-widest max-w-[240px] opacity-30">Define parameters on the left to begin generation</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function ParamCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm hover:border-indigo-100 transition-all cursor-default">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1 font-mono">{label}</span>
            <span className="text-sm font-black text-slate-800 tracking-tight">{value}</span>
        </div>
    );
}

export default CreativeStudio;
