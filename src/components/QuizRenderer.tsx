import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Send, RefreshCcw, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn } from '../lib/utils';

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'blank' | 'essay';
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete?: (score: number) => void;
}

export const QuizRenderer: React.FC<QuizProps> = ({ questions }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const currentQuestion = questions[currentIdx];

  const handleAnswer = (answer: any) => {
    if (showFeedback) return;
    setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const checkAnswer = () => {
    setShowFeedback(true);
    const isCorrect = userAnswers[currentQuestion.id]?.toString().toLowerCase().trim() === currentQuestion.answer?.toLowerCase().trim();
    if (isCorrect) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const renderText = (text: string) => (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text}
      </ReactMarkdown>
    </div>
  );

  if (quizComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-[2.5rem] border-brand-neon/20 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-brand-neon/10 rounded-full flex items-center justify-center mx-auto border border-brand-neon/30">
          <CheckCircle2 className="w-10 h-10 text-brand-neon" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Quiz Complete!</h2>
          <p className="text-slate-500 text-sm">Nexus Assessment Protocol Finished</p>
        </div>
        <div className="text-5xl font-black text-brand-neon">
          {Math.round((score / questions.length) * 100)}%
        </div>
        <p className="text-zinc-500 font-mono text-[10px] uppercase">Score: {score} / {questions.length}</p>
        <button 
          onClick={() => {
            setCurrentIdx(0);
            setUserAnswers({});
            setQuizComplete(false);
            setScore(0);
          }}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3"
        >
          <RefreshCcw className="w-4 h-4" /> Restart Session
        </button>
      </motion.div>
    );
  }

  return (
    <div className="glass p-8 rounded-[2.5rem] border-brand-sky/20 space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          className="h-full bg-brand-sky shadow-[0_0_10px_rgba(56,189,248,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-sky/10 border border-brand-sky/30 flex items-center justify-center text-brand-sky">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-[10px] mono text-brand-sky uppercase font-black tracking-widest">Synthesis_Task_0{currentIdx + 1}</span>
        </div>
        <span className="text-[10px] mono text-slate-500 font-bold uppercase">{currentIdx + 1} OF {questions.length}</span>
      </div>

      <div className="text-xl font-bold text-black leading-tight">
        {renderText(currentQuestion.question)}
      </div>

      <div className="space-y-3">
        {currentQuestion.type === 'mcq' && currentQuestion.options?.map((opt, i) => {
          const isSelected = userAnswers[currentQuestion.id] === opt;
          const isCorrect = opt === currentQuestion.answer;
          const showCorrectPath = showFeedback && isCorrect;
          const showWrongPath = showFeedback && isSelected && !isCorrect;

          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={showFeedback}
              className={cn(
                "w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between group",
                isSelected ? "bg-brand-blue/10 border-brand-blue/30 text-brand-blue" : "bg-white border-slate-200 text-black hover:border-brand-blue/30 hover:bg-slate-50",
                showCorrectPath && "bg-brand-neon/10 border-brand-neon/40 text-brand-neon",
                showWrongPath && "bg-red-500/10 border-red-500/40 text-red-500"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center border shrink-0",
                  isSelected ? "border-brand-blue text-brand-blue font-bold" : "border-slate-200 text-transparent",
                  showCorrectPath && "border-brand-neon text-brand-neon font-bold",
                  showWrongPath && "border-red-500 text-red-500"
                )}>
                  {showCorrectPath ? <CheckCircle2 className="w-4 h-4" /> : isSelected ? <Circle className="w-3 h-3 fill-current" /> : null}
                </div>
                <div className="font-medium text-sm flex-1">{renderText(opt)}</div>
              </div>
            </button>
          );
        })}

        {currentQuestion.type === 'blank' && (
          <div className="space-y-4">
            <input 
              type="text"
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              disabled={showFeedback}
              placeholder="Enter your synthesized answer..."
              className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-slate-800 font-mono placeholder:text-slate-300 outline-none focus:border-brand-blue/30 transition-all shadow-sm"
            />
          </div>
        )}

        {currentQuestion.type === 'essay' && (
          <textarea 
            value={userAnswers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            disabled={showFeedback}
            placeholder="Synthesize your comprehensive response..."
            className="w-full h-40 p-6 bg-white border border-slate-100 rounded-3xl text-slate-800 leading-relaxed placeholder:text-slate-300 outline-none focus:border-brand-blue/30 transition-all resize-none shadow-sm"
          />
        )}
      </div>

      {showFeedback && currentQuestion.explanation && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-slate-500 text-xs italic leading-relaxed"
        >
          <span className="text-brand-blue font-bold not-italic mr-2 uppercase mono text-[9px]">Explanation_Data:</span>
          {renderText(currentQuestion.explanation)}
        </motion.div>
      )}

      <div className="pt-4 flex gap-4">
        {!showFeedback && currentQuestion.type !== 'essay' ? (
          <button 
            disabled={!userAnswers[currentQuestion.id]}
            onClick={checkAnswer}
            className="flex-1 py-4 bg-brand-sky text-black font-black rounded-2xl text-xs mono uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand-sky/20 disabled:grayscale disabled:opacity-50"
          >
            Verify Synthesis
          </button>
        ) : (
          <button 
            onClick={nextQuestion}
            className="flex-1 py-4 bg-slate-100 text-black font-black rounded-2xl text-xs mono uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all border border-slate-200"
          >
            {currentIdx === questions.length - 1 ? 'Finalize Protocol' : 'Proceed to Next Node'}
          </button>
        )}
      </div>
    </div>
  );
};
