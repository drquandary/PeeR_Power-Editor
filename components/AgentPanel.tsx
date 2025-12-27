import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisIssue, JournalStyle } from '../types';
import { 
  Send, 
  Loader2, 
  User, 
  Bot, 
  Sparkles, 
  Eye, 
  X,
  Info,
  Minus
} from 'lucide-react';

interface AgentPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  loading: boolean;
  onPreviewProposal: (issue: AnalysisIssue) => void;
  onApplyProposal: (issue: AnalysisIssue) => void;
  onCancelPreview: () => void;
  previewingId?: string | null;
  journal: JournalStyle;
  onMinimize?: () => void;
  onClose?: () => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({
  messages,
  onSendMessage,
  loading,
  onPreviewProposal,
  onApplyProposal,
  onCancelPreview,
  previewingId,
  journal,
  onMinimize,
  onClose
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Refined Header with Window Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-1.5 rounded-lg shadow-inner">
            <Bot className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Scholar Agent</h2>
            <p className="text-[10px] text-slate-400">Mode: {journal}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            {onMinimize && (
              <button 
                onClick={onMinimize} 
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                title="Minimize"
              >
                <Minus className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            )}
            {onClose && (
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-500 rounded-lg transition-colors group"
                title="Close"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Academic Assistant</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              I can help you polish your paper for <strong>{journal}</strong> standards. Try asking:
            </p>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => setInput("Review my abstract for clarity.")} className="w-full p-2 text-[10px] text-left text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 transition-colors">"Review my abstract for clarity."</button>
              <button type="button" onClick={() => setInput("Check if my methodology section is too long.")} className="w-full p-2 text-[10px] text-left text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 transition-colors">"Check if my methodology section is too long."</button>
            </div>
          </div>
        )}
        
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              {m.content}
            </div>
            
            {/* Proposals Cards */}
            {m.proposals && m.proposals.length > 0 && (
              <div className="mt-3 w-full space-y-2 animate-in fade-in slide-in-from-top-2">
                {m.proposals.map(p => {
                  const isPreviewing = previewingId === p.id;
                  return (
                    <div key={p.id} className={`bg-white border p-3 rounded-xl shadow-md transition-all ${isPreviewing ? 'ring-2 ring-indigo-500 border-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-indigo-100 p-1 rounded">
                           <Info className="w-3 h-3 text-indigo-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{p.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{p.description}</p>
                      
                      {isPreviewing ? (
                        <div className="space-y-3 mb-2 animate-in zoom-in-95 duration-200">
                           <div className="space-y-1">
                             <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">Current</div>
                             <div className="text-[10px] bg-red-50 text-red-800 p-2 rounded-lg border border-red-100 line-through italic">
                               {p.snippet}
                             </div>
                           </div>
                           <div className="space-y-1">
                             <div className="text-[9px] font-bold text-green-500 uppercase tracking-widest ml-1">Suggested</div>
                             <div className="text-[10px] bg-green-50 text-green-900 p-2 rounded-lg border border-green-100 font-medium">
                               {p.replacement}
                             </div>
                           </div>
                           <div className="flex gap-2 mt-2">
                              <button type="button" onClick={onCancelPreview} className="flex-1 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">Discard</button>
                              <button type="button" onClick={() => onApplyProposal(p)} className="flex-1 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg active:scale-95">Apply Fix</button>
                           </div>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => onPreviewProposal(p)}
                          className="w-full py-2 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                          <Eye className="w-3 h-3" /> Preview Edit
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 flex items-center gap-1.5">
              {m.role === 'user' ? 'Author' : 'Scholar Agent'}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-3 text-slate-400 italic text-xs py-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            Thinking...
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex gap-2 items-center bg-slate-100 p-1 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Talk to the agent..."
            className="flex-1 bg-transparent border-none py-2 px-4 text-sm focus:outline-none disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-md active:scale-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgentPanel;