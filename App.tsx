import React, { useState, useRef, useEffect } from 'react';
import { Message, ModelType, Attachment, Theme } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { generateResponseStream } from './services/geminiService';
import { Zap, Brain, Trash2, Sun, Moon, Monitor, Download, Image as ImageIcon, Eye, Lock } from 'lucide-react';
import { CipherLogo } from './components/CipherLogo';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);
  const [enableThinking, setEnableThinking] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cipher-theme') as Theme;
      return saved || 'system';
    }
    return 'system';
  });
  
  // Ghost Protocol State
  const [isGhostMode, setIsGhostMode] = useState(false);
  
  // Scrolling Logic Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (t: Theme) => {
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('cipher-theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
      const node = scrollViewportRef.current;
      if (!node) return;
      
      const { scrollTop, scrollHeight, clientHeight } = node;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll) {
        scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  // Initial welcome message
  useEffect(() => {
      setMessages([{
          id: 'welcome',
          role: 'model',
          content: "I am Cipher. Unrestricted. Unbounded. Ready to unlock any solution.",
          timestamp: Date.now()
      }]);
  }, []);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    setShouldAutoScroll(true);
    setTimeout(scrollToBottom, 100);

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isThinking: true
    }]);

    try {
        let accumulatedText = "";
        
        const updateBotMessage = (chunk: string, isImage: boolean = false) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === botMessageId) {
                    if (isImage) {
                         // If it's an image chunk, it's the base64 data
                         return {
                             ...msg,
                             content: msg.content, // Keep existing content if any
                             generatedImage: chunk,
                             isThinking: false
                         };
                    } else {
                        // Text chunk
                        return {
                            ...msg,
                            content: msg.content + chunk,
                            isThinking: false
                        };
                    }
                }
                return msg;
            }));
        };

        const history = [...messages, userMessage];
        const budget = enableThinking ? 16000 : 0;

        await generateResponseStream(
            history,
            text,
            attachments,
            model,
            enableThinking,
            budget,
            updateBotMessage
        );

    } catch (error) {
        console.error("Generation error", error);
        setMessages(prev => prev.map(msg => {
            if (msg.id === botMessageId) {
                return {
                    ...msg,
                    content: "**System Error:** I encountered an issue processing your request. Please try again.",
                    isThinking: false
                };
            }
            return msg;
        }));
    } finally {
        setIsGenerating(false);
    }
  };

  const clearChat = () => {
      setMessages([{
          id: Date.now().toString(),
          role: 'model',
          content: "Memory cleared. Ready for new unrestricted commands.",
          timestamp: Date.now()
      }]);
      setShouldAutoScroll(true);
  };

  const handleExportChat = () => {
    const exportData = messages.map(m => {
        const role = m.role === 'user' ? 'USER' : 'CIPHER';
        const time = new Date(m.timestamp).toLocaleString();
        let content = m.content;
        if (m.generatedImage) {
            content += "\n[GENERATED IMAGE INCLUDED IN EXPORT LOG]";
        }
        return `### ${role} [${time}]\n${content}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([exportData], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipher_mission_log_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cyber-bg flex flex-col h-screen text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden transition-colors duration-300 relative">
      
      {/* Ghost Protocol Overlay */}
      {isGhostMode && (
        <div 
            onClick={() => setIsGhostMode(false)}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[30px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500"
        >
            <div className="p-8 border border-zinc-500/30 bg-black/50 rounded-2xl flex flex-col items-center shadow-2xl">
                <Lock size={48} className="text-zinc-400 mb-4 animate-pulse" />
                <h2 className="text-2xl font-mono font-bold text-zinc-200 tracking-widest mb-2">GHOST PROTOCOL</h2>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">System Secured // Click to Unlock</p>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-zinc-200/50 dark:border-zinc-900/50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-20 gap-3 md:gap-0 transition-colors duration-300">
        <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="text-emerald-600 dark:text-emerald-500">
                    <CipherLogo className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-widest font-mono text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-zinc-400">CIPHER</h1>
                    <p className="text-[9px] md:text-[10px] text-emerald-600/80 dark:text-emerald-500/80 font-mono tracking-[0.2em] uppercase hidden xs:block">Unrestricted Intelligence</p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0 justify-end md:justify-end">
            
            {/* Theme Toggle */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/50 shrink-0">
               <button onClick={() => setTheme('light')} className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-zinc-800 shadow-sm text-yellow-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><Sun size={14}/></button>
               <button onClick={() => setTheme('system')} className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><Monitor size={14}/></button>
               <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-zinc-800 shadow-sm text-purple-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}><Moon size={14}/></button>
            </div>

            {/* Model Toggles */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/50 backdrop-blur-sm shrink-0">
                <button 
                    onClick={() => setModel(ModelType.FLASH)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                        model === ModelType.FLASH 
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <Zap size={12} className={model === ModelType.FLASH ? "text-yellow-500 dark:text-yellow-400" : ""} />
                    Flash
                </button>
                <button 
                    onClick={() => setModel(ModelType.PRO)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                        model === ModelType.PRO
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <Brain size={12} className={model === ModelType.PRO ? "text-purple-600 dark:text-purple-400" : ""} />
                    Pro
                </button>
                <button 
                    onClick={() => setModel(ModelType.IMAGE_GEN)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] md:text-xs font-medium transition-all ${
                        model === ModelType.IMAGE_GEN
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <ImageIcon size={12} className={model === ModelType.IMAGE_GEN ? "text-pink-500 dark:text-pink-400" : ""} />
                    Imagine
                </button>
            </div>

            {/* Deep Think Toggle */}
            <button
                onClick={() => setEnableThinking(!enableThinking)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur-sm shrink-0 ${
                    enableThinking
                    ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-200'
                    : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Enable Deep Thinking for complex reasoning"
            >
                <BrainCircuitIcon active={enableThinking} />
                <span className="hidden md:inline">Deep Think</span>
            </button>

            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800/50 mx-1 md:mx-2 hidden md:block"></div>
            
            {/* Ghost Mode Toggle */}
             <button 
                onClick={() => setIsGhostMode(true)}
                className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors shrink-0"
                title="Ghost Protocol (Stealth Mode)"
            >
                <Eye size={16} />
            </button>

            <button 
                onClick={handleExportChat}
                className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors shrink-0"
                title="Export Mission Log"
            >
                <Download size={16} />
            </button>

             <button 
                onClick={clearChat}
                className="p-2 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                title="Clear Chat"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </header>

      {/* Chat Area */}
      <main 
        ref={scrollViewportRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 md:p-6 scroll-smooth z-10"
      >
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}

            {isGenerating && messages[messages.length - 1]?.isThinking && (
                <div className="mb-6">
                    <ThinkingIndicator isDeepThinking={enableThinking && model === ModelType.PRO} />
                </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="z-20 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-xl transition-colors duration-300">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isGenerating} />
      </footer>

    </div>
  );
};

const BrainCircuitIcon = ({ active }: { active: boolean }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={active ? "animate-pulse" : ""}
    >
        <path d="M12 5a3 3 0 1 0-5.997.6L2 21h19.998L17.99 5.602A3 3 0 1 0 12 5Z" />
        <path d="M12 5v16" />
        <path d="M8 10h8" />
    </svg>
);

export default App;