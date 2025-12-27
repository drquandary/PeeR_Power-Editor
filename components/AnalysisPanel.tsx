
import React, { useState } from 'react';
import { EditorMode, AnalysisResult, JournalStyle, AnalysisIssue, RelatedPaper, CitationPlacement } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Bot, 
  Loader2,
  RefreshCw,
  Sparkles,
  FileText,
  Wand2,
  Eye,
  X,
  Check,
  ChevronLeft,
  BookOpen,
  Plus,
  ArrowRight,
  Quote,
  LocateFixed,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AnalysisPanelProps {
  mode: EditorMode;
  result: AnalysisResult | null;
  journal: JournalStyle;
  setJournal: (j: JournalStyle) => void;
  onAnalyze: () => void;
  previewingIssue: AnalysisIssue | null;
  onPreview: (issue: AnalysisIssue) => void;
  onCancelPreview: () => void;
  onConfirmFix: (issue: AnalysisIssue) => void;
  onAddReference?: (ref: string) => void;
  onCiteAtSelection?: (marker: string) => void;
  onSuggestPlacements?: (paper: RelatedPaper) => void;
  onCloseMobile?: () => void;
  onHumanize?: (style: string) => void;
  onAnonymize?: () => void;
  onCheckConsistency?: () => void;
  onGenerateCoverLetter?: () => void;
  generatedCoverLetter?: string;
  isProcessing?: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  mode, 
  result, 
  journal, 
  setJournal, 
  onAnalyze,
  previewingIssue,
  onPreview,
  onCancelPreview,
  onConfirmFix,
  onAddReference,
  onCiteAtSelection,
  onSuggestPlacements,
  onCloseMobile,
  onHumanize,
  onAnonymize,
  onCheckConsistency,
  onGenerateCoverLetter,
  generatedCoverLetter,
  isProcessing
}) => {
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [humanizeStyle, setHumanizeStyle] = useState("Academic & Engaging");
  
  const getHeader = () => {
    switch(mode) {
      case EditorMode.DE_AI: return "De-AI & Humanizer";
      case EditorMode.REVIEW: return "Peer Reviewer #2";
      case EditorMode.FORMAT: return "Style Compliance";
      case EditorMode.REORGANIZE: return "Structural Feedback";
      case EditorMode.DISCOVERY: return "Research Discovery";
      case EditorMode.SUBMIT: return "Submission Readiness";
      default: return "Assistant";
    }
  };

  const getDescription = () => {
     switch(mode) {
      case EditorMode.DE_AI: return "Detects LLM patterns and suggests more human phrasing.";
      case EditorMode.REVIEW: return "Simulates a harsh journal reviewer to find gaps.";
      case EditorMode.FORMAT: return "Checks citations and style rules.";
      case EditorMode.REORGANIZE: return "Optimizes flow for the target journal.";
      case EditorMode.DISCOVERY: return "Explore related literature and background research.";
      case EditorMode.SUBMIT: return "Anonymization, consistency checks, and cover letters.";
      default: return "";
    }
  };

  const renderStats = () => {
    if (!result || mode !== EditorMode.DE_AI) return null;
    
    const data = [
      { name: 'AI Probability', value: result.stats.aiProbabilityScore, color: result.stats.aiProbabilityScore > 50 ? '#ef4444' : '#22c55e' },
      { name: 'Human', value: 100 - result.stats.aiProbabilityScore, color: '#e2e8f0' },
    ];

    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-6">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Detection Score</h4>
        <div className="h-32 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-xl font-bold ${result.stats.aiProbabilityScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
                {result.stats.aiProbabilityScore}%
              </span>
            </div>
        </div>
        <p className="text-xs text-center text-slate-500 mt-1">Probability of AI Generation</p>

        {/* Humanizer Tools */}
        <div className="mt-6 pt-4 border-t border-slate-100">
             <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Humanizer Tools</h4>
             <select
                value={humanizeStyle}
                onChange={(e) => setHumanizeStyle(e.target.value)}
                className="w-full text-xs p-2 mb-2 border border-slate-200 rounded bg-slate-50"
             >
                <option value="Academic & Engaging">Academic & Engaging</option>
                <option value="Conversational">Conversational (Blog/Op-Ed)</option>
                <option value="Narrative">Narrative (Storytelling)</option>
                <option value="Objective & Concise">Objective & Concise</option>
             </select>
             <button
               onClick={() => onHumanize?.(humanizeStyle)}
               disabled={isProcessing}
               className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
             >
                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                Rewrite to Humanize
             </button>
             <p className="text-[10px] text-slate-400 mt-2 text-center">Applies to active section only.</p>
        </div>
      </div>
    );
  };

  const renderSubmitTools = () => {
    if (mode !== EditorMode.SUBMIT) return null;

    return (
      <div className="space-y-6">
         {/* Anonymizer */}
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
               <div className="p-2 bg-indigo-50 rounded-lg"><Eye className="w-5 h-5 text-indigo-600"/></div>
               <div>
                  <h4 className="font-bold text-sm text-slate-800">Blind Review Prep</h4>
                  <p className="text-xs text-slate-500">Remove names, affiliations & self-citations.</p>
               </div>
            </div>
            <button
              onClick={onAnonymize}
              disabled={isProcessing}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              {isProcessing ? "Processing..." : "Anonymize Document"}
            </button>
         </div>

         {/* Consistency */}
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
               <div className="p-2 bg-amber-50 rounded-lg"><CheckCircle className="w-5 h-5 text-amber-600"/></div>
               <div>
                  <h4 className="font-bold text-sm text-slate-800">Consistency Check</h4>
                  <p className="text-xs text-slate-500">Verify acronyms, spelling & citations.</p>
               </div>
            </div>
            <button
               onClick={onCheckConsistency}
               disabled={isProcessing}
               className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
               {isProcessing ? "Checking..." : "Run Consistency Check"}
            </button>
         </div>

         {/* Cover Letter */}
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
               <div className="p-2 bg-emerald-50 rounded-lg"><FileText className="w-5 h-5 text-emerald-600"/></div>
               <div>
                  <h4 className="font-bold text-sm text-slate-800">Cover Letter</h4>
                  <p className="text-xs text-slate-500">Draft a submission letter for {journal}.</p>
               </div>
            </div>
            <button
              onClick={onGenerateCoverLetter}
              disabled={isProcessing}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              {isProcessing ? "Drafting..." : "Draft Cover Letter"}
            </button>
         </div>

         {generatedCoverLetter && (
           <div className="bg-slate-800 text-slate-300 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap">
             {generatedCoverLetter}
           </div>
         )}
      </div>
    );
  };

  const renderDiscovery = () => {
    if (mode !== EditorMode.DISCOVERY) return null;

    if (!result?.discovery || result.discovery.length === 0) {
      return (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-600 mb-2">No Research Found Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a sentence in your paper and click <strong>"Cite Sources"</strong> to discover related literature.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Recommended Reading ({result.discovery.length})
        </h3>
        {result.discovery.map((paper) => (
          <div key={paper.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all group">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {paper.title}
                </h4>
                <span className="text-[10px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">{paper.year}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 font-medium">{paper.authors}</p>
              
              <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50 mb-3">
                <p className="text-[11px] text-indigo-900 leading-relaxed italic">
                  "{paper.relevance}"
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onCiteAtSelection?.(paper.citationMarker)}
                  className="w-full py-2 text-[11px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Quote className="w-3.5 h-3.5" /> Cite at Selection
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => onAddReference?.(paper.fullReference)}
                    className="flex-1 py-1.5 text-[10px] font-bold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Add to Refs
                  </button>
                  <button 
                    onClick={() => {
                      setExpandedPaper(expandedPaper === paper.id ? null : paper.id);
                      if (expandedPaper !== paper.id) onSuggestPlacements?.(paper);
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border ${
                      expandedPaper === paper.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <LocateFixed className="w-3 h-3" /> Suggest Placements
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Placements Expansion */}
            {expandedPaper === paper.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Sparkles className="w-3 h-3 text-indigo-500" /> Recommended Placements
                </h5>
                
                {!paper.suggestedPlacements ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing Document...
                  </div>
                ) : paper.suggestedPlacements.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">No ideal placements found in this section.</div>
                ) : (
                  paper.suggestedPlacements.map((placement, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-xs group/item cursor-pointer hover:border-indigo-400" onClick={() => onCiteAtSelection?.(paper.citationMarker)}>
                      <p className="text-[10px] text-slate-500 font-bold mb-1 group-hover/item:text-indigo-600">Why here?</p>
                      <p className="text-[11px] text-slate-700 leading-relaxed italic mb-2">"...{placement.snippet}..."</p>
                      <div className="text-[10px] text-slate-500 leading-snug bg-slate-50 p-1.5 rounded border border-slate-100">
                        {placement.explanation}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full md:w-96 bg-slate-50 border-l border-slate-200 flex flex-col h-full overflow-hidden shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-2">
            {onCloseMobile && (
                <button onClick={onCloseMobile} className="md:hidden p-1 -ml-1 hover:bg-slate-100 rounded text-slate-600"><ChevronLeft className="w-5 h-5"/></button>
            )}
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {mode === EditorMode.DE_AI && <Bot className="w-5 h-5 text-indigo-500"/>}
                {getHeader()}
            </h2>
        </div>
        
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{getDescription()}</p>

        {mode !== EditorMode.DISCOVERY && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Journal</label>
              <select 
                value={journal}
                onChange={(e) => setJournal(e.target.value as JournalStyle)}
                className="w-full text-sm p-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Object.values(JournalStyle).map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            <button onClick={onAnalyze} disabled={result?.loading} className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 font-medium text-sm transition-all ${result?.loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'}`}>
              {result?.loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Analyzing...</> : <><RefreshCw className="w-4 h-4"/> Run Analysis</>}
            </button>
          </div>
        )}
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderStats()}
        {renderDiscovery()}
        {renderSubmitTools()}

        {result && !result.loading && result.generalFeedback && mode !== EditorMode.DISCOVERY && mode !== EditorMode.SUBMIT && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Summary</h4>
            {result.generalFeedback}
          </div>
        )}
        {result && !result.loading && result.issues.length > 0 && mode !== EditorMode.DISCOVERY && mode !== EditorMode.SUBMIT ? (
          <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Findings ({result.issues.length})</h3>
             {result.issues.map((issue) => (
               <div key={issue.id} className={`bg-white p-3 rounded-lg border shadow-sm transition-all duration-300 group ${previewingIssue?.id === issue.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-indigo-300'}`}>
                  <div className="flex items-start gap-2 mb-1">
                    {issue.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                    <h5 className="text-sm font-semibold text-slate-800">{issue.title}</h5>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{issue.description}</p>
                  {issue.suggestion && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                       {previewingIssue?.id === issue.id ? (
                         <div className="space-y-2 mb-3">
                           <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-800 mb-3 italic">💡 Tip: {issue.suggestion}</div>
                           <div className="text-xs"><span className="font-semibold text-red-600 block mb-1">Original:</span><div className="bg-red-50 text-red-800 p-2 rounded border border-red-100 line-through">{issue.snippet}</div></div>
                           <div className="text-xs mt-2"><span className="font-semibold text-green-600 block mb-1">Replacement:</span><div className="bg-green-50 text-green-800 p-2 rounded border border-green-100">{issue.replacement}</div></div>
                           <div className="flex gap-2 mt-2">
                              <button onClick={() => onCancelPreview()} className="flex-1 py-1.5 text-xs border border-slate-300 rounded">Cancel</button>
                              <button onClick={() => onConfirmFix(issue)} className="flex-1 py-1.5 text-xs bg-indigo-600 text-white rounded font-semibold">Apply</button>
                           </div>
                         </div>
                       ) : (
                         <button onClick={() => onPreview(issue)} className="w-full py-1.5 text-xs bg-white border border-indigo-200 text-indigo-700 rounded transition-all flex items-center justify-center gap-2"><Eye className="w-3 h-3" /> Review Fix</button>
                       )}
                    </div>
                  )}
               </div>
             ))}
          </div>
        ) : (!result?.loading && mode !== EditorMode.DISCOVERY && mode !== EditorMode.SUBMIT && <div className="text-center py-10 text-slate-400"><p className="text-sm">Run analysis to see results.</p></div>)}
      </div>
    </div>
  );
};

export default AnalysisPanel;
