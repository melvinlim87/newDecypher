import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Code2 } from 'lucide-react';

function AIAnalysisChatSimple() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col text-white"
      style={{
        background: 'linear-gradient(180deg, #333333 0%, #18181b 100%) !important',
        width: '100vw',
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        border: 'none',
        outline: 'none',
        position: 'relative',
        paddingTop: '80px'
      }}>
      
      {/* Main Header */}
      <div className="fixed top-[80px] right-0 z-40 bg-transparent py-4 w-full">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <div className="relative w-10 h-10 rounded-full bg-gray-800 mr-3 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Analysis</h1>
          </div>
        </div>
      </div>
      
      {/* Global dot pattern overlay */}
      <div className="fixed inset-0 z-0" style={{ 
        backgroundImage: 'radial-gradient(rgba(0, 229, 255, 0.15) 2px, transparent 2px)',
        backgroundSize: '30px 30px',
        opacity: 0.3,
        pointerEvents: 'none'
      }}></div>
      
      {/* Main Content */}
      <div className="max-w-full flex flex-col gap-6 w-full relative z-10 px-4 py-4 mt-16">
        <div className="w-full h-full flex flex-col space-y-6 px-1 sm:px-2 md:px-4 mt-0">
          {/* Main Card */}
          <div className="flex flex-col h-full rounded-lg p-0 overflow-hidden mt-0 w-[90%] mx-auto" style={{
            background: 'linear-gradient(135deg, #444444 0%, #2a2a2a 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(192, 192, 192, 0.2), 0 0 30px rgba(192, 192, 192, 0.1)',
            border: '3px solid #555555'
          }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" /> AI Analysis Chat
              </h3>
            </div>
            
            <div className="p-6 min-h-[400px] flex flex-col justify-between">
              <div className="flex-1 mb-6">
                <div className="p-4 rounded-lg bg-gray-800/50 mb-4">
                  <p className="text-cyan-300 font-medium">AI Assistant</p>
                  <p className="mt-2 text-white">
                    Welcome to the AI Analysis Chat! This is a simplified version of the interface with our new consistent styling.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-800/30">
                  <p className="text-cyan-300 font-medium">You</p>
                  <p className="mt-2 text-white">
                    I'd like to see the original UI with all functionality.
                  </p>
                </div>
              </div>
              
              {/* New Conversation Button */}
              <div className="mt-1">
                <button
                  onClick={() => navigate('/')}
                  className="w-full mb-2 py-1 px-3 rounded-lg flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-all duration-200"
                >
                  <MessageSquare className="w-5 h-5 mr-2 text-cyan-400" />
                  <span className="text-white">New Conversation</span>
                </button>
              </div>
              
              {/* Input Area */}
              <div className="flex flex-wrap md:flex-nowrap gap-1 items-end w-full min-h-[60px] mt-auto p-2 rounded-lg bg-gray-800/50">
                <textarea
                  placeholder="Type your message..."
                  defaultValue=""
                  className="flex-1 p-2 rounded-lg w-full min-w-[200px] resize-none text-sm bg-gray-700/50 text-white"
                  rows={2}
                />
                <button
                  className="ml-1 p-3 rounded-full flex items-center justify-center bg-cyan-800 hover:bg-cyan-700"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAnalysisChatSimple;
