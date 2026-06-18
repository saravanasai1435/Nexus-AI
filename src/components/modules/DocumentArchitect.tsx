import React from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { FileDown, Wand2, Type, Sparkles, Languages, CheckCheck } from 'lucide-react';

interface Props {
  content: string;
  onChange: (content: string) => void;
  onAIAction: (action: 'rewrite' | 'insert') => void;
  isProcessing: boolean;
}

const DocumentArchitect: React.FC<Props> = ({ content, onChange, onAIAction, isProcessing }) => {
  const exportToDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun(content.replace(/<[^>]*>/g, '')),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "NexusAI_Document.docx");
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-[48px] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 transition-all duration-700">
      {/* Editor Header */}
      <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-[24px] bg-slate-50 text-indigo-600 shadow-sm">
            <Type className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tighter">Document Architect</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Neural Drafting Engine v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onAIAction('rewrite')}
            disabled={isProcessing}
            className="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[13px] font-black hover:bg-indigo-100 transition-all disabled:opacity-50 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Polish with AI
          </button>
          <button
            onClick={() => onAIAction('insert')}
            disabled={isProcessing}
            className="flex items-center gap-3 px-6 py-3 border border-slate-100 text-slate-500 rounded-2xl text-[13px] font-black hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
          >
            <Wand2 className="w-4 h-4" />
            Continue
          </button>
          <div className="w-px h-8 bg-slate-100 mx-2" />
          <button
            onClick={exportToDocx}
            className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[13px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            Export DOCX
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ReactQuill
          theme="snow"
          value={content}
          onChange={onChange}
          modules={modules}
          className="h-full"
        />
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold text-slate-800">Intelligence at work...</span>
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] font-bold text-slate-400">
        <div className="flex items-center gap-4 uppercase tracking-widest">
          <div className="flex items-center gap-1.5"><CheckCheck className="w-3 h-3 text-emerald-500" /> Auto-Save Active</div>
          <div>{content.replace(/<[^>]*>/g, '').length} Characters</div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-indigo-600">Rich Text Ready</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentArchitect;
