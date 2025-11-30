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
  
  const [isGhostMode, setIsGhostMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Theme Handling
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

  // Initial Message
  useEffect(() => {
      setMessages([{
          id: 'welcome',
          role: 'model',
          content: "I am Cipher. Ready to unlock any solution.",
          timestamp: Date.now()
      }]);
  }, []);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    // Optimistic User Message
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

    // Placeholder Bot Message
    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        isThinking: true
    }]);

    try {
        const updateBotMessage = (chunk: string, isImage: boolean = false) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === botMessageId) {
                    if (isImage) {
                         return {
                             ...msg,
                             generatedImage: chunk,
                             isThinking: false
                         };
                    } else {
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
        // Budget logic: 16k is a good middle ground for thinking
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

    } catch (error: any) {
        console.error("App Generation Error:", error);
        
        let errorMessage = "An unknown error occurred.";
        if (error.message) {
             errorMessage = error.message;
             
             // Try to parse JSON error from API
             const jsonMatch = errorMessage.match(/\{.*}/s);
             if (jsonMatch) {
                 try {
                     const errorObj = JSON.parse(jsonMatch[0]);
                     if (errorObj.error) {
                        // Handle 429 Resource Exhausted
                        if (errorObj.error.code === 429 || errorObj.error.status === 'RESOURCE_EXHAUSTED') {
                             errorMessage = "⚠️ **Quota Exceeded (Rate Limit)**\n\nYou have reached the usage limit for the free tier of this model. Please wait a minute before trying again.";
                             
                             const retryDelay = errorObj.error.details?.find((d: any) => d.retryDelay)?.retryDelay;
                             if (retryDelay) {
                                 errorMessage += `\n\n**Retry available in:** ${retryDelay}`;
                             }
                        } else {
                             errorMessage = `**API Error:** ${errorObj.error.message}`;
                        }
                     }
                 } catch (e) {
                     // If parsing fails, use the raw message but cleaned up
                     errorMessage = error.message;
                 }
             }
        }
        
        // Enhance error message for typical missing key scenario
        if (errorMessage.includes("400") || errorMessage.includes("API key")) {
             errorMessage += "\n\n**Action Required:** Please verify your `API_KEY` is set correctly in Vercel Environment Variables.";
        }

        setMessages(prev => prev.map(msg => {
            if (msg.id === botMessageId) {
                return {
                    ...msg,
                    content: errorMessage,
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
          content: "Memory cleared.",
          timestamp: Date.now()
      }]);
  };

  const handleExportChat = () => {
    const exportData = messages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipher_log.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="cyber-bg flex flex-col h-screen text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      
      {/* Ghost Mode Overlay */}
      {isGhostMode && (
        <div 
            onClick={() => setIsGhostMode(false)}
            className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm"
        >
            <Lock size={48} className="text-emerald-500 mb-4 animate-pulse" />
            <h2 className="text-xl font-mono text-white">SYSTEM LOCKED</h2>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-b border-zinc-200/50 dark:border-zinc-800 bg-white/80 dark:bg-[#050505]/90 backdrop-blur-md sticky top-0 z-20 gap-2">
        <div className="flex items-center gap-3">
            <CipherLogo className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
            <div>
                <h1 className="text-lg font-bold font-mono tracking-wider">CIPHER</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-mono tracking-[0.2em] uppercase hidden sm:block">Unrestricted</p>
            </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 justify-between md:justify-end">
            
            {/* Model Selector */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button 
                    onClick={() => setModel(ModelType.FLASH)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${model === ModelType.FLASH ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-zinc-500'}`}
                >
                    Flash
                </button>
                <button 
                    onClick={() => setModel(ModelType.PRO)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${model === ModelType.PRO ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-zinc-500'}`}
                >
                    Pro
                </button>
                <button 
                    onClick={() => setModel(ModelType.IMAGE_GEN)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${model === ModelType.IMAGE_GEN ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-zinc-500'}`}
                >
                    Imagine
                </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                 <button onClick={() => setEnableThinking(!enableThinking)} className={`p-2 rounded-lg transition-colors ${enableThinking ? 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'text-zinc-400 hover:text-zinc-600'}`}>
                    <Brain size={18} />
                 </button>
                 <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-zinc-400 hover:text-yellow-500 transition-colors">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                 </button>
                 <button onClick={() => setIsGhostMode(true)} className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors hidden sm:block">
                    <Eye size={18} />
                 </button>
                 <button onClick={clearChat} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                 </button>
            </div>
        </div>
      </header>

      {/* Main Chat */}
      <main ref={scrollViewportRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            {isGenerating && messages[messages.length - 1]?.isThinking && (
                <div className="mt-2">
                    <ThinkingIndicator isDeepThinking={enableThinking} />
                </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Footer Input */}
      <footer className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isGenerating} />
      </footer>
    </div>
  );
};

export default App;
