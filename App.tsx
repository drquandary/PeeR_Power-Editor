
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import AnalysisPanel from './components/AnalysisPanel';
import AgentPanel from './components/AgentPanel';
import { EditorMode, JournalStyle, AnalysisResult, AnalysisIssue, ChatMessage, PaperSection, RelatedPaper } from './types';
import { 
  analyzeDeAI, 
  performJournalReview, 
  checkFormatting, 
  reorganizePaper, 
  microEdit, 
  suggestCitations,
  findCitationPlacements,
  agentChat,
  humanizeText,
  anonymizeContent,
  checkConsistency,
  generateCoverLetter
} from './services/geminiService';
import { Eraser, Wand2, Quote, Menu, X, Sparkles, MessageSquare, Download, Layers, FileText, Loader2, Upload, FileUp, ListRestart, BookOpen, ChevronRight } from 'lucide-react';

const INITIAL_SECTIONS: PaperSection[] = [
  { id: 'abstract', title: 'Abstract', content: 'Artificial Intelligence (AI) has rapidly evolved, becoming a tapestry of innovation in various fields. It is paramount to underscore the significance of Large Language Models (LLMs) in this landscape.' },
  { id: 'intro', title: 'Introduction', content: 'The rapid proliferation of digital technologies has ushered in a new era of information dissemination. It is important to note that the data landscape is shifting.' },
  { id: 'methods', title: 'Methods', content: 'We utilize a novel framework to assess the performance of transformers in zero-shot environments.' },
  { id: 'refs', title: 'References', content: '' }
];

const modularizeText = (text: string): PaperSection[] => {
  const sections: PaperSection[] = [];
  const lines = text.split(/\r?\n/);
  let currentHeader = '';
  let currentContent: string[] = [];
  let sectionCount = 0;
  lines.forEach((line) => {
    const headerMatch = line.match(/^\s*(#+)\s*(.+?)\s*$/) || line.match(/^\s*([A-Z\s]{4,})\s*$/);
    if (headerMatch) {
      if (currentContent.length > 0 || currentHeader) {
        sections.push({ id: `sec-${sectionCount++}-${Date.now()}`, title: currentHeader || 'Front Matter', content: currentContent.join('\n').trim() });
      }
      currentHeader = headerMatch[2] || headerMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });
  if (currentContent.length > 0 || currentHeader) {
    sections.push({ id: `sec-${sectionCount++}-${Date.now()}`, title: currentHeader || 'Introduction', content: currentContent.join('\n').trim() });
  }
  return sections.length === 0 ? INITIAL_SECTIONS : sections;
};

function App() {
  const [mode, setMode] = useState<EditorMode>(EditorMode.WRITE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sections, setSections] = useState<PaperSection[]>(INITIAL_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<string>('abstract');
  const [isFullDocMode, setIsFullDocMode] = useState(false);
  const [journal, setJournal] = useState<JournalStyle>(JournalStyle.GENERAL);
  const [agentVisible, setAgentVisible] = useState(false);
  const [agentMinimized, setAgentMinimized] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [previewingIssue, setPreviewingIssue] = useState<AnalysisIssue | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [selection, setSelection] = useState<{ text: string, start: number, end: number, sectionId?: string } | null>(null);
  const [showMicroEditTooltip, setShowMicroEditTooltip] = useState(false);
  const [microEditLoading, setMicroEditLoading] = useState(false);
  const [generatedCoverLetterText, setGeneratedCoverLetterText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSection = useMemo(() => sections.find(s => s.id === activeSectionId) || sections[0], [sections, activeSectionId]);
  const fullText = useMemo(() => sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n'), [sections]);

  const handleScroll = () => { if (textareaRef.current && backdropRef.current) backdropRef.current.scrollTop = textareaRef.current.scrollTop; };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>, sectionId?: string) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const targetContent = sectionId ? sections.find(s => s.id === sectionId)?.content || "" : isFullDocMode ? fullText : activeSection.content;
      const selectedText = targetContent.substring(start, end);
      if (selectedText.trim().length > 1) {
          setSelection({ text: selectedText, start, end, sectionId });
          setShowMicroEditTooltip(true);
      } else { setShowMicroEditTooltip(false); }
    } else if (showMicroEditTooltip) { setShowMicroEditTooltip(false); }
  };

  const handleMicroEdit = async (instruction: string) => {
    if (!selection) return;
    setMicroEditLoading(true);
    try {
      const newText = await microEdit(selection.text, instruction);
      updateDocumentAtSelection(newText);
    } finally { setMicroEditLoading(false); }
  };

  const handleAddReference = (fullRef: string) => {
    setSections(prev => {
      const newState = [...prev];
      let refsIdx = newState.findIndex(s => s.title.toLowerCase().includes('reference'));
      if (refsIdx === -1) {
         newState.push({ id: 'refs-auto', title: 'References', content: '' });
         refsIdx = newState.length - 1;
      }
      const s = newState[refsIdx];
      const separator = s.content.trim() ? '\n' : '';
      newState[refsIdx] = { ...s, content: s.content.trim() + separator + fullRef };
      return newState;
    });
  };

  const handleCiteAtSelection = (marker: string) => {
    if (!selection) {
      alert("Please select a sentence in the editor first.");
      return;
    }
    const updatedSegment = selection.text + " " + marker;
    updateDocumentAtSelection(updatedSegment, true);
  };

  const handleSuggestPlacements = async (paper: RelatedPaper) => {
    if (!analysisResult?.discovery) return;
    try {
      const placements = await findCitationPlacements(paper, fullText);
      setAnalysisResult(prev => {
        if (!prev || !prev.discovery) return prev;
        return {
          ...prev,
          discovery: prev.discovery.map(p => p.id === paper.id ? { ...p, suggestedPlacements: placements } : p)
        };
      });
    } catch (e) { console.error(e); }
  };

  const handleSuggestCitations = async () => {
    if (!selection) return;
    setMicroEditLoading(true);
    try {
        const { citationMarker, references, relatedPapers } = await suggestCitations(selection.text);
        const updatedSegment = selection.text + " " + (citationMarker || "");
        updateDocumentAtSelection(updatedSegment, true);
        references.forEach(ref => handleAddReference(ref));
        setAnalysisResult({
          stats: { wordCount: 0, aiProbabilityScore: 0, readabilityScore: 0 },
          issues: [],
          generalFeedback: "Literature cluster identified.",
          discovery: relatedPapers,
          loading: false
        });
        setMode(EditorMode.DISCOVERY);
        setSelection(null);
        setShowMicroEditTooltip(false);
    } catch (err) { console.error(err); } finally { setMicroEditLoading(false); }
  };

  const updateDocumentAtSelection = (newSegment: string, skipSelectionReset = false) => {
    if (!selection) return;
    if (isFullDocMode && !selection.sectionId) {
      const before = fullText.substring(0, selection.start);
      const after = fullText.substring(selection.end);
      setSections(modularizeText(before + newSegment + after));
    } else {
      const targetId = selection.sectionId || activeSectionId;
      setSections(prev => prev.map(s => s.id === targetId ? { ...s, content: s.content.substring(0, selection.start) + newSegment + s.content.substring(selection.end) } : s));
    }
    if (!skipSelectionReset) { setSelection(null); setShowMicroEditTooltip(false); }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const newSections = modularizeText(importText);
    setSections(newSections);
    setActiveSectionId(newSections[0].id);
    setIsImportModalOpen(false);
    setImportText("");
  };

  const handlePreviewFix = (issue: AnalysisIssue) => {
    if (!issue.snippet || fullText.indexOf(issue.snippet) === -1) return;
    setPreviewingIssue(issue);
  };

  const handleConfirmFix = (issue: AnalysisIssue) => {
    if (!issue.snippet || !issue.replacement) return;
    setSections(prev => prev.map(s => s.content.includes(issue.snippet!) ? { ...s, content: s.content.replace(issue.snippet!, issue.replacement!) } : s));
    setPreviewingIssue(null);
    if (analysisResult) setAnalysisResult({ ...analysisResult, issues: analysisResult.issues.filter(i => i.id !== issue.id) });
  };

  const handleAgentMessage = async (msgContent: string) => {
    setChatHistory(prev => [...prev, { role: 'user', content: msgContent, timestamp: Date.now() }]);
    setAgentLoading(true);
    try {
      const response = await agentChat(msgContent, chatHistory, fullText, journal);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.content, proposals: response.proposals, timestamp: Date.now() }]);
    } finally { setAgentLoading(false); }
  };

  const runAnalysis = async () => {
    setAnalysisResult({ stats: { wordCount: 0, aiProbabilityScore: 0, readabilityScore: 0 }, issues: [], generalFeedback: '', loading: true });
    try {
      let result;
      if (mode === EditorMode.DE_AI) result = await analyzeDeAI(fullText);
      else if (mode === EditorMode.REVIEW) result = await performJournalReview(fullText, journal);
      else if (mode === EditorMode.FORMAT) result = await checkFormatting(fullText, journal);
      else if (mode === EditorMode.REORGANIZE) result = { generalFeedback: await reorganizePaper(fullText, journal), issues: [] };
      
      setAnalysisResult({ stats: result.stats || { wordCount: 0, aiProbabilityScore: 0, readabilityScore: 0 }, issues: result.issues || [], generalFeedback: result.generalFeedback || result.feedback || "", loading: false });
    } catch (e) { setAnalysisResult(null); }
  };

  const handleHumanize = async (style: string) => {
      setMicroEditLoading(true);
      try {
          const newText = await humanizeText(activeSection.content, style);
          setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, content: newText } : s));
      } finally { setMicroEditLoading(false); }
  };

  const handleAnonymize = async () => {
      setMicroEditLoading(true);
      try {
          if (isFullDocMode) {
              const newText = await anonymizeContent(fullText);
              setSections(modularizeText(newText));
          } else {
              const newText = await anonymizeContent(activeSection.content);
              setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, content: newText } : s));
          }
      } finally { setMicroEditLoading(false); }
  };

  const handleConsistencyCheck = async () => {
      setAnalysisResult({ stats: { wordCount: 0, aiProbabilityScore: 0, readabilityScore: 0 }, issues: [], generalFeedback: '', loading: true });
      try {
          const result = await checkConsistency(fullText);
          setAnalysisResult({
              stats: { wordCount: 0, aiProbabilityScore: 0, readabilityScore: 0 },
              issues: result.issues || [],
              generalFeedback: result.generalFeedback || "Consistency check complete.",
              loading: false
          });
      } catch(e) { setAnalysisResult(null); }
  };

  const handleGenerateCoverLetter = async () => {
      setMicroEditLoading(true);
      try {
          const letter = await generateCoverLetter(fullText, journal);
          setGeneratedCoverLetterText(letter);
      } finally { setMicroEditLoading(false); }
  };

  const exportPaper = (modular: boolean) => {
    const text = modular ? sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n') : fullText;
    const blob = new Blob([text], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scholar_paper.md';
    a.click();
  };

  const renderHighlights = () => {
    const activeContent = isFullDocMode ? fullText : activeSection.content;
    const issue = previewingIssue;
    if (!issue || !issue.snippet || !activeContent.includes(issue.snippet)) return <div className="text-transparent whitespace-pre-wrap font-serif text-lg leading-relaxed px-4 md:px-8 py-8">{activeContent}</div>;
    const pos = activeContent.indexOf(issue.snippet);
    return (
      <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed px-4 md:px-8 py-8">
        <span className="text-transparent">{activeContent.substring(0, pos)}</span>
        <mark className="bg-indigo-300 text-transparent rounded-sm">{activeContent.substring(pos, pos + issue.snippet.length)}</mark>
        <span className="text-transparent">{activeContent.substring(pos + issue.snippet.length)}</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar 
        currentMode={mode} 
        setMode={(m) => { setMode(m); setAnalysisResult(null); setPreviewingIssue(null); if (m === EditorMode.AGENT) setAgentVisible(true); }} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        sections={sections}
        activeSectionId={activeSectionId}
        setActiveSectionId={setActiveSectionId}
      />
      
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 text-slate-600"><Menu className="w-5 h-5" /></button>
                <button onClick={() => setIsFullDocMode(!isFullDocMode)} className={`p-1.5 rounded-full px-3 border flex items-center gap-2 ${isFullDocMode ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                    <BookOpen className="w-4 h-4" /><span className="text-[10px] font-bold uppercase">{isFullDocMode ? 'Exit Full View' : 'Full Document'}</span>
                </button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsImportModalOpen(true)} className="p-2 text-slate-600 hover:text-indigo-600"><Upload className="w-5 h-5" /></button>
                <button onClick={() => exportPaper(false)} className="p-2 text-slate-600 hover:text-indigo-600"><Download className="w-5 h-5" /></button>
                <button onClick={() => setSections(INITIAL_SECTIONS)} className="p-2 text-slate-600 hover:text-red-500"><Eraser className="w-5 h-5" /></button>
            </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-white">
            <div ref={backdropRef} className="absolute inset-0 pointer-events-none z-0 overflow-auto">{renderHighlights()}</div>
            {!isFullDocMode ? (
              <textarea 
                ref={textareaRef} 
                className="absolute inset-0 w-full h-full p-4 md:p-8 outline-none font-serif text-lg leading-relaxed bg-transparent text-slate-800 resize-none z-10 overflow-auto mix-blend-multiply" 
                value={activeSection.content} 
                onChange={(e) => setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, content: e.target.value } : s))} 
                onScroll={handleScroll} 
                onSelect={handleSelect}
              />
            ) : (
              <div className="absolute inset-0 w-full h-full p-4 md:p-8 outline-none z-10 overflow-auto space-y-12">
                 {sections.map(s => (
                   <div key={s.id}>
                      <div className="flex items-center gap-3 mb-4 opacity-50"><div className="h-px flex-1 bg-slate-200"></div><span className="text-[10px] font-black uppercase tracking-widest">{s.title}</span><div className="h-px flex-1 bg-slate-200"></div></div>
                      <textarea className="w-full min-h-[100px] outline-none font-serif text-lg bg-transparent resize-none overflow-hidden" value={s.content} rows={s.content.split('\n').length + 1} onSelect={(e) => handleSelect(e, s.id)} onChange={(e) => setSections(prev => prev.map(sec => sec.id === s.id ? { ...sec, content: e.target.value } : sec))} />
                   </div>
                 ))}
                 <div className="h-32"></div>
              </div>
            )}
            
            <div className={`fixed md:bottom-12 top-24 left-1/2 -translate-x-1/2 z-[110] transition-all duration-300 ${showMicroEditTooltip ? 'translate-y-0 opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="bg-slate-900 text-white rounded-full shadow-2xl flex items-center p-1.5 border border-slate-700">
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-[10px] text-slate-400 border border-slate-700 mr-2">{selection?.text.length || 0} chars</div>
                    <button onClick={() => handleMicroEdit("Make it more academic")} disabled={microEditLoading} className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 rounded-full text-xs font-bold mr-1 disabled:opacity-50">Academic</button>
                    <button onClick={handleSuggestCitations} disabled={microEditLoading} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      {microEditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Quote className="w-3 h-3" />} Cite Sources
                    </button>
                    <button onClick={() => setShowMicroEditTooltip(false)} className="p-2 ml-2 hover:bg-slate-800 rounded-full"><X className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center"><h3 className="text-xl font-bold">Import Paper</h3><button onClick={() => setIsImportModalOpen(false)}><X className="w-6 h-6"/></button></div>
              <div className="p-6"><textarea className="w-full h-80 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl outline-none font-mono text-sm" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="# Section Title..." /></div>
              <div className="p-6 bg-slate-50 flex gap-3"><button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500">Cancel</button><button onClick={handleImport} className="flex-[2] py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg">Process & Modularize</button></div>
           </div>
        </div>
      )}

      {agentVisible && !agentMinimized && (
        <div className="fixed z-[100] inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[650px] md:max-h-[85vh]">
          <div className="w-full h-full bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <AgentPanel messages={chatHistory} onSendMessage={handleAgentMessage} loading={agentLoading} onPreviewProposal={handlePreviewFix} onApplyProposal={handleConfirmFix} onCancelPreview={() => setPreviewingIssue(null)} previewingId={previewingIssue?.id} journal={journal} onMinimize={() => setAgentMinimized(true)} onClose={() => setAgentVisible(false)} />
          </div>
        </div>
      )}

      {mode !== EditorMode.WRITE && mode !== EditorMode.AGENT && (
        <AnalysisPanel 
          mode={mode} 
          result={analysisResult} 
          journal={journal} 
          setJournal={setJournal} 
          onAnalyze={runAnalysis} 
          previewingIssue={previewingIssue} 
          onPreview={handlePreviewFix} 
          onCancelPreview={() => setPreviewingIssue(null)} 
          onConfirmFix={handleConfirmFix} 
          onAddReference={handleAddReference}
          onCiteAtSelection={handleCiteAtSelection}
          onSuggestPlacements={handleSuggestPlacements}
          onCloseMobile={() => setMode(EditorMode.WRITE)}
          onHumanize={handleHumanize}
          onAnonymize={handleAnonymize}
          onCheckConsistency={handleConsistencyCheck}
          onGenerateCoverLetter={handleGenerateCoverLetter}
          generatedCoverLetter={generatedCoverLetterText}
          isProcessing={microEditLoading}
        />
      )}
    </div>
  );
}

export default App;
