import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Code2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History } from 'lucide-react';
import { HistoryList } from './HistoryDropdown';
import { useAnalysisContext } from '../context/AnalysisContext';
// Removed unused imports
import { useSidebarState } from '../contexts/SidebarContext';

interface SideBarProps {}

export function SideBar({}: SideBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetAnalysis } = useAnalysisContext();
  // Removed unused theme and toggle variables
  const { isCollapsed, toggleSidebar } = useSidebarState();
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isEAGeneratorExpanded, setIsEAGeneratorExpanded] = useState(false);

  // Handler for new analysis - resets context and navigates
  const handleNewAnalysis = () => {
    resetAnalysis();
    navigate('/ai-chat', { replace: true, state: { newSession: true } });
  };

  // Handler for new EA - navigates with clean state
  const handleNewEA = () => {
    navigate('/ea-generator', { replace: true, state: { newSession: true } });
  };

  return (
    <div 
      className={`h-full overflow-y-auto scrollbar-hide backdrop-blur-xl transition-all duration-300 metallic-gradient metallic-border metallic-glow ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{ borderTop: 'none', position: 'relative', zIndex: 40, pointerEvents: 'auto', height: '100%', top: 0 }}
    >


      <div className={`flex flex-col ${isCollapsed ? 'p-2' : 'p-4'} space-y-2 pb-16 relative z-40`} style={{ pointerEvents: 'auto' }}>
        {/* Analyzer with integrated history */}
        <div>
          <button
            onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'} rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover transition-all duration-300 ${location.pathname === '/ai-chat' && !isAnalysisExpanded ? 'blue-glow' : ''} cursor-pointer`}
            style={{ pointerEvents: 'auto' }}
          >
            <MessageSquare className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''} text-white`} />
            {!isCollapsed && (
              <>
                <span className="ml-3 flex-grow text-left text-white font-medium">Analyzer</span>
                {isAnalysisExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white" />
                )}
              </>
            )}
          </button>
          
          {!isCollapsed && isAnalysisExpanded && (
            <div className="ml-8 mt-2 space-y-1">
              <button
                onClick={handleNewAnalysis}
                className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <span className="text-white font-medium">AI Chat Generate</span>
              </button>
              
              <HistoryList 
                isCollapsed={isCollapsed}
                isExpanded={true}
                onToggle={() => {}}
                historyType="market-analysis"
                label="History"
                compact={true}
              />
              
              <Link 
                to="/analysis-history"
                className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="flex items-center">
                  <History className="w-4 h-4 mr-2 text-white" />
                  <span className="text-white font-medium">See All History</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Algo Generator with integrated history */}
        <div>
          <button
            onClick={() => setIsEAGeneratorExpanded(!isEAGeneratorExpanded)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'} rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover transition-all duration-300 ${location.pathname === '/ea-generator' && !isEAGeneratorExpanded ? 'blue-glow' : ''} cursor-pointer`}
            style={{ pointerEvents: 'auto' }}
          >
            <Code2 className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''} text-white`} />
            {!isCollapsed && (
              <>
                <span className="ml-3 flex-grow text-left text-white font-medium">Strategy Generator</span>
                {isEAGeneratorExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white" />
                )}
              </>
            )}
          </button>
          
          {!isCollapsed && isEAGeneratorExpanded && (
            <div className="ml-8 mt-2 space-y-1">
              <button
                onClick={handleNewEA}
                className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <span className="text-white font-medium">EA Generate</span>
              </button>
              
              <HistoryList 
                isCollapsed={isCollapsed}
                isExpanded={true}
                onToggle={() => {}}
                historyType="ea-generator"
                label="History"
                compact={true}
              />
              
              <Link 
                to="/ea-history"
                className="block w-full text-left px-4 py-2 text-sm rounded-lg metallic-gradient metallic-border metallic-glow nav-link-hover cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="flex items-center">
                  <History className="w-4 h-4 mr-2 text-white" />
                  <span className="text-white font-medium">See All History</span>
                </div>
              </Link>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Collapse button as a footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#0085d7]/30 metallic-gradient z-50" style={{ boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <button
          onClick={() => toggleSidebar()}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center py-4' : 'px-4 py-4'} transition-all duration-300 hover:bg-[#0085d7]/10 cursor-pointer`}
          style={{ pointerEvents: 'auto' }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-white" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-white mr-2" />
              <span className="flex-grow text-left text-white font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}