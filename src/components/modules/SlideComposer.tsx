import React from 'react';
import { Presentation, Download, Monitor, ChevronRight, Layout, Plus, Play, Sparkles } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { motion } from 'motion/react';

interface Slide {
  title: string;
  content: string[];
}

interface Props {
  slides: Slide[];
}

const SlideComposer: React.FC<Props> = ({ slides }) => {
  const exportToPptx = () => {
    const pres = new pptxgen();
    slides.forEach(slide => {
      const s = pres.addSlide();
      s.addText(slide.title, { x: 0.5, y: 0.5, fontSize: 32, bold: true, color: '363636' });
      s.addText(slide.content.join("\n"), { x: 0.5, y: 1.5, fontSize: 18, color: '666666' });
    });
    pres.writeFile({ fileName: "NexusAI_Presentation.pptx" });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-[48px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 transition-all duration-700">
      <div className="px-12 py-10 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-[28px] bg-indigo-50 text-indigo-600 shadow-sm">
            <Presentation className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tighter">Slide Composer</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Generative Deck Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-3 px-6 py-3 border border-slate-100 text-slate-500 rounded-2xl text-[13px] font-black hover:bg-slate-50 transition-all active:scale-95">
            <Play className="w-4 h-4" />
            Present
          </button>
          <button
            onClick={exportToPptx}
            disabled={slides.length === 0}
            className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[13px] font-black hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download PPTX
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 bg-slate-50/20 custom-scrollbar">
        {slides.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-8 animate-float">
            <div className="w-24 h-24 bg-white border border-slate-50 rounded-[40px] shadow-xl flex items-center justify-center text-indigo-200 ring-8 ring-indigo-50/50">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h4 className="text-slate-800 font-black text-2xl tracking-tighter">Deck empty</h4>
              <p className="text-sm text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                Brief the assistant in the sidebar to generate a high-fidelity presentation outline.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {slides.map((slide, index) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={index}
                transition={{ delay: index * 0.05 }}
                className="aspect-video bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col group hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all cursor-pointer"
              >
                <div className="p-8 border-b border-slate-50 group-hover:bg-indigo-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">Sequence {index + 1}</span>
                    <Layout className="w-4 h-4 text-slate-200" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 line-clamp-1 tracking-tight">{slide.title}</h4>
                </div>
                <div className="p-8 flex-1 overflow-hidden">
                  <ul className="space-y-4">
                    {slide.content.slice(0, 3).map((point, i) => (
                      <li key={i} className="flex items-start gap-4 text-[15px] text-slate-500 font-bold">
                        <div className="mt-2 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 shadow-[0_0_8px_#6366f1]" />
                        <span className="line-clamp-2">{point}</span>
                      </li>
                    ))}
                    {slide.content.length > 3 && (
                        <li className="text-[11px] font-black text-slate-300 italic tracking-widest ml-6 uppercase">+{slide.content.length - 3} additional metrics</li>
                    )}
                  </ul>
                </div>
              </motion.div>
            ))}
            <button className="aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-indigo-400 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                <div className="p-5 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-10 h-10" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Append Sequence</span>
            </button>
          </div>
        )}
      </div>

      <div className="px-12 py-6 bg-white border-t border-slate-50 flex items-center justify-between text-[11px] font-black text-slate-300 uppercase tracking-widest">
        <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-emerald-500"><Monitor className="w-4 h-4" /> Rendering Stable</span>
            <span>{slides.length} Components Active</span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-slate-400">Draft v1.0</span>
            <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default SlideComposer;
