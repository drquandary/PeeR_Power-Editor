
import React from 'react';
import { 
  FileText, 
  ShieldAlert, 
  Glasses, 
  LayoutTemplate, 
  Settings2,
  Menu,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Hash,
  Search
} from 'lucide-react';
import { EditorMode, PaperSection } from '../types';

interface SidebarProps {
  currentMode: EditorMode;
  setMode: (mode: EditorMode) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sections: PaperSection[];
  activeSectionId: string;
  setActiveSectionId: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  setMode, 
  isOpen, 
  setIsOpen, 
  sections, 
  activeSectionId, 
  setActiveSectionId 
}) => {
  const menuItems = [
    { mode: EditorMode.WRITE, icon: FileText, label: 'Write & Edit' },
    { mode: EditorMode.AGENT, icon: MessageSquare, label: 'Paper Agent' },
    { mode: EditorMode.DISCOVERY, icon: Search, label: 'Research Discovery' },
    { mode: EditorMode.DE_AI, icon: ShieldAlert, label: 'De-AI Detector' },
    { mode: EditorMode.REVIEW, icon: Glasses, label: 'AI Peer Review' },
    { mode: EditorMode.FORMAT, icon: Settings2, label: 'Format Check' },
    { mode: EditorMode.REORGANIZE, icon: LayoutTemplate, label: 'Reorganize' },
  ];

  return (
    <div className={`
      flex flex-col bg-slate-950 text-white transition-all duration-300 border-r border-slate-800 z-50
      fixed inset-y-0 left-0 md:relative
      ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 w-72 md:w-16'}
    `}>
      <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16 shrink-0">
        <div className={`flex items-center space-x-2 text-indigo-400 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            <BookOpen className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">ScholarPolish</span>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-slate-800 rounded transition-colors hidden md:block"
        >
          <Menu className="w-6 h-6 text-slate-400" />
        </button>

        <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-1 hover:bg-slate-800 rounded text-slate-400"
        >
            <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Tools */}
        <nav className="py-4 space-y-1 shrink-0">
          <div className={`px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${!isOpen && 'hidden'}`}>
             Editor Tools
          </div>
          {menuItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`
                w-full flex items-center px-4 py-2.5 transition-colors duration-200
                ${currentMode === item.mode 
                  ? 'bg-indigo-600/20 text-indigo-400 border-r-4 border-indigo-500' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'}
              `}
              title={!isOpen ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 min-w-[20px] ${isOpen ? 'mr-3' : 'mx-auto'}`} />
              <span className={`font-medium text-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden md:block'}`}>
                  {item.label}
              </span>
              <span className="md:hidden font-medium text-sm ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="h-px bg-slate-800 mx-4 my-2 shrink-0"></div>

        {/* Paper Structure */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className={`px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between ${!isOpen && 'hidden'}`}>
             <span>Paper Structure</span>
             <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{sections.length}</span>
          </div>
          
          <div className={`flex-1 overflow-y-auto py-2 no-scrollbar ${!isOpen && 'hidden md:block'}`}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSectionId(section.id);
                  if (currentMode !== EditorMode.WRITE) setMode(EditorMode.WRITE);
                }}
                className={`
                  w-full flex items-center px-4 py-2.5 group transition-all
                  ${activeSectionId === section.id 
                    ? 'text-white bg-slate-900' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'}
                `}
              >
                {isOpen ? (
                  <>
                    <Hash className={`w-3.5 h-3.5 mr-3 shrink-0 ${activeSectionId === section.id ? 'text-indigo-500' : 'text-slate-600'}`} />
                    <span className="text-xs font-medium truncate flex-1 text-left">{section.title}</span>
                    {activeSectionId === section.id && <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
                  </>
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto ${activeSectionId === section.id ? 'bg-indigo-500 scale-150' : 'bg-slate-700'}`}></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className={`text-[10px] text-slate-600 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
             <p className="font-mono">SCHOLAR-POLISH-ENGINE_V1</p>
             <p className="mt-1">Gemini 3 Pro Active</p>
        </div>
      </div>
    </div>
  );
};

// Added missing default export to fix the module import error in App.tsx
export default Sidebar;
