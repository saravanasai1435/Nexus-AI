import React from 'react';
import { Camera, Upload, Search, FileText, Image as ImageIcon, Sparkles, X, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  preview: string | null;
  onImageChange: (url: string | null) => void;
  analysis: string | null;
}

const VisionLab: React.FC<Props> = ({ preview, onImageChange, analysis }) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onImageChange(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-[48px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 transition-all duration-700">
      <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[28px] bg-slate-50 text-indigo-600 shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter">Vision Lab</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Multimodal Scene Analysis</p>
          </div>
        </div>
        
        {preview && (
            <button 
                onClick={() => onImageChange(null)}
                className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[20px] text-[13px] font-black transition-all active:scale-95"
            >
                <X className="w-4 h-4" />
                Reset Engine
            </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Input Area */}
        <div className="w-1/2 p-12 border-r border-slate-50 bg-slate-50/20 overflow-y-auto custom-scrollbar">
          {!preview ? (
            <div className="h-full flex flex-col items-center justify-center">
              <label className="w-full max-w-md aspect-square flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-100 rounded-[64px] hover:border-indigo-200 hover:bg-white transition-all cursor-pointer group bg-white shadow-sm">
                <input type="file" className="hidden" onChange={handleFile} accept="image/*" />
                <div className="p-8 rounded-[40px] bg-slate-50 text-slate-300 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:scale-110 group-hover:rotate-3">
                  <Upload className="w-12 h-12" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tighter">Ingest Visuals</h4>
                <p className="text-sm text-slate-400 font-bold text-center uppercase tracking-wide leading-relaxed">
                  Drop high-res imagery for<br/>neural processing
                </p>
                <div className="mt-12 flex gap-3">
                   <div className="px-5 py-2.5 rounded-2xl bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Gemini Vision Ready</div>
                </div>
              </label>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-8">
              <div className="p-3 bg-white border border-slate-100 rounded-[48px] shadow-2xl shadow-indigo-100/30 relative group overflow-hidden">
                <img src={preview} alt="Context" className="w-full aspect-square object-cover rounded-[40px] transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                     <Search className="w-16 h-16 text-white" />
                </div>
              </div>
              <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h5 className="font-black text-lg tracking-tight">Active Context</h5>
                </div>
                <p className="text-sm font-bold opacity-70 leading-relaxed mb-8 uppercase tracking-wide">
                  Intelligence stream active. Use the sidebar to query details or extract textual data from this visual frame.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-center uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer">Semantic OCR</div>
                    <div className="px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-center uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer">Logic Trace</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-12"
              >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Activity className="w-6 h-6 text-indigo-600" />
                        <h4 className="font-black text-slate-800 text-2xl tracking-tighter">Analysis Protocol</h4>
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest font-mono">Flash 1.5 Sync</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <ReportStat label="Neural Confidence" value="99.4%" />
                    <ReportStat label="Protocol" value="Logic-V" />
                </div>

                <div className="border-t border-slate-50 pt-12">
                  <div className="flex items-center gap-3 text-indigo-600 mb-6">
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest font-mono">Synthesized Intelligence</span>
                  </div>
                  <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
                    <p className="text-[16px] leading-[1.8] text-slate-600 whitespace-pre-wrap font-bold tracking-tight">
                      {analysis}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale p-12 animate-float">
                <ImageIcon className="w-24 h-24 text-slate-200 mb-8" />
                <h4 className="text-2xl font-black text-slate-300 tracking-tighter mb-2">Awaiting Stream</h4>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Neural data will materialize here</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

function ReportStat({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] shadow-sm">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1 font-mono">{label}</span>
            <span className="text-xl font-black text-slate-800 tracking-tight">{value}</span>
        </div>
    );
}

export default VisionLab;
