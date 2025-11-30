import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Attachment } from '../types';
import { Cpu, Copy, Check, Terminal, Play, FileText, Music, Code, Volume2, StopCircle, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { CipherAvatar } from './CipherAvatar';
import { UserAvatar } from './UserAvatar';
import { AudioVisualizer } from './AudioVisualizer';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Helper to render attachments in history
  const renderAttachment = (att: Attachment, idx: number) => {
      if (att.mimeType.startsWith('image/')) {
          return (
            <img 
                key={idx} 
                src={`data:${att.mimeType};base64,${att.data}`} 
                alt="attachment" 
                className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-zinc-200 dark:border-white/10 shadow-lg"
            />
          );
      }
      
      let Icon = FileText;
      if (att.mimeType.includes('audio')) Icon = Music;
      if (att.mimeType.includes('text') || att.mimeType.includes('code')) Icon = Code;

      return (
          <div key={idx} className="flex items-center gap-3 bg-zinc-100 dark:bg-black/20 p-3 rounded-lg border border-zinc-200 dark:border-white/10 max-w-xs">
              <div className="p-2 bg-white dark:bg-white/5 rounded-md border border-zinc-200 dark:border-transparent">
                  <Icon size={16} className="text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-zinc-700 dark:text-zinc-200 truncate font-medium">{att.fileName || 'Attached File'}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">{att.mimeType.split('/')[1] || 'FILE'}</span>
              </div>
          </div>
      );
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content);
    // Attempt to pick a decent voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex w-full max-w-[95%] md:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-1 shadow-md relative z-10 transition-colors duration-300 ${
            isUser 
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 shadow-[0_0_20px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/30' 
            : 'bg-white dark:bg-[#0a0a0c] border border-zinc-200 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        }`}>
          {isUser ? (
             <UserAvatar className="w-6 h-6 text-white" />
          ) : (
             <CipherAvatar className="w-6 h-6" />
          )}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'} flex-1`}>
            <div className={`relative px-6 py-5 rounded-2xl shadow-sm backdrop-blur-md transition-colors duration-300 ${
            isUser 
                ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 dark:from-[#1e1b4b]/80 dark:to-[#312e81]/80 border border-indigo-500/30 text-white dark:text-indigo-50 rounded-tr-none shadow-[0_4px_20px_rgba(79,70,229,0.2)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                : 'bg-white/80 dark:bg-[#121214]/80 border border-zinc-200 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200 rounded-tl-none w-full shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
            }`}>
            
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {message.attachments.map((att, idx) => renderAttachment(att, idx))}
                </div>
            )}

            {/* AI Generated Image */}
            {message.generatedImage && (
                <div className="mb-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700/50 shadow-lg group relative">
                    <img 
                        src={`data:image/png;base64,${message.generatedImage}`} 
                        alt="AI Generated" 
                        className="w-full h-auto object-cover max-h-[500px]" 
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
                        <ImageIcon size={12} className="text-pink-400" />
                        <span className="text-[10px] font-medium text-white tracking-wide">CIPHER VISUALIZATION</span>
                    </div>
                </div>
            )}

            {/* Markdown Content */}
            <div className={`prose prose-sm md:prose-base max-w-none break-words leading-relaxed font-light ${isUser ? 'prose-invert text-indigo-50' : 'dark:prose-invert text-zinc-800 dark:text-zinc-200'}`}>
                <ReactMarkdown
                    components={{
                        // Code Block Handler
                        code(props) {
                            const {children, className, node, ...rest} = props;
                            const match = /language-(\w+)/.exec(className || '');
                            const isInline = !match && !String(children).includes('\n');

                            if (isInline) {
                                return (
                                    <code {...rest} className={`px-1.5 py-0.5 rounded-md font-mono text-sm border ${
                                        isUser 
                                        ? 'bg-indigo-950/30 text-indigo-100 border-indigo-200/20' 
                                        : 'bg-zinc-100 dark:bg-zinc-800/50 text-emerald-700 dark:text-emerald-300 border-zinc-200 dark:border-emerald-500/10'
                                    }`}>
                                        {children}
                                    </code>
                                );
                            }

                            const language = match ? match[1] : 'text';
                            return (
                                <CodeBlock language={language} value={String(children).replace(/\n$/, '')} />
                            );
                        },
                        // Headings
                        h1: ({children}) => <h1 className={`text-2xl font-bold mb-6 pb-2 border-b ${isUser ? 'border-white/10 text-white' : 'border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-zinc-400'}`}>{children}</h1>,
                        h2: ({children}) => <h2 className={`text-xl font-semibold mt-8 mb-4 flex items-center gap-2 ${isUser ? 'text-indigo-100' : 'text-emerald-600 dark:text-emerald-400'}`}><span className="w-1 h-6 bg-emerald-500 rounded-full inline-block"></span>{children}</h2>,
                        h3: ({children}) => <h3 className={`text-lg font-medium mt-6 mb-3 ${isUser ? 'text-indigo-100' : 'text-zinc-800 dark:text-zinc-100'}`}>{children}</h3>,
                        // Links
                        a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-400 transition-all">{children}</a>,
                        strong: ({children}) => <strong className="font-bold">{children}</strong>
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>

            </div>

            {/* Timestamp / Info */}
            <div className={`flex items-center gap-2 mt-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-[10px] text-zinc-500 font-medium font-mono opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {message.role === 'model' && (
                    <div className="flex items-center gap-2">
                        {isSpeaking ? (
                            <AudioVisualizer />
                        ) : (
                           <Cpu size={10} className="text-emerald-700/50 dark:text-emerald-900/50" />
                        )}
                        
                        <button 
                            onClick={handleSpeak} 
                            className={`p-1 transition-colors rounded-md ${isSpeaking ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                            title="Read Aloud"
                        >
                            {isSpeaking ? <StopCircle size={12} /> : <Volume2 size={12} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for Code Blocks with Preview
const CodeBlock = ({ language, value }: { language: string, value: string }) => {
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isRunnable = ['html', 'javascript', 'js', 'svg'].includes(language.toLowerCase());

    const handleRun = () => {
        // Fallback for run button (open in new tab)
        let content = value;
        let type = 'text/html';

        if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
             content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Cipher Code Run</title>
                    <style>body { font-family: sans-serif; padding: 20px; background: #f4f4f5; color: #18181b; }</style>
                </head>
                <body>
                    <div id="output"></div>
                    <script>
                        const log = console.log;
                        const outputDiv = document.getElementById('output');
                        console.log = (...args) => {
                            args.forEach(arg => {
                                const div = document.createElement('div');
                                div.textContent = typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
                                div.style.borderBottom = '1px solid #ddd';
                                div.style.padding = '4px 0';
                                outputDiv.appendChild(div);
                            });
                            log(...args);
                        };
                    </script>
                    <script>
                        try {
                            ${value}
                        } catch(err) {
                            console.log('Error:', err.message);
                        }
                    </script>
                </body>
                </html>
             `;
        }
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    // Construct Preview Content for Iframe
    const getPreviewContent = () => {
         if (language === 'html' || language === 'svg') return value;
         if (language === 'javascript' || language === 'js') {
             return `
                <html>
                <body style="margin:0; font-family: sans-serif; color: #fff; background-color: #000;">
                    <div id="console-output" style="padding: 1rem; font-family: monospace;"></div>
                    <script>
                        const out = document.getElementById('console-output');
                        console.log = (...args) => {
                            const line = document.createElement('div');
                            line.innerText = '> ' + args.join(' ');
                            line.style.borderBottom = '1px solid #333';
                            line.style.padding = '2px 0';
                            out.appendChild(line);
                        }
                        try { ${value} } catch(e) { console.log('Error:', e.message) }
                    </script>
                </body>
                </html>
             `;
         }
         return '';
    };

    return (
        <div className="my-6 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#08080a] shadow-lg group text-left">
            {/* Code Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#121214] border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                         <Terminal size={12} className="text-zinc-500" />
                         <span className="text-xs text-zinc-400 font-mono font-medium lowercase tracking-wide">{language || 'text'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    
                    {/* Preview Toggle for Web Code */}
                    {isRunnable && (
                        <button 
                            onClick={() => setShowPreview(!showPreview)}
                            className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-md border ${
                                showPreview 
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                : 'text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 border-transparent hover:border-indigo-500/20'
                            }`}
                            title="Toggle Preview"
                        >
                            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                            <span className="font-medium">{showPreview ? 'Code' : 'Preview'}</span>
                        </button>
                    )}

                    {isRunnable && !showPreview && (
                        <button 
                            onClick={handleRun}
                            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded-md hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                            title="Run in new tab"
                        >
                            <Play size={12} className="fill-current" />
                            <span className="font-medium hidden sm:inline">Run</span>
                        </button>
                    )}

                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                    >
                        {copied ? (
                            <>
                                <Check size={12} className="text-emerald-400" />
                                <span className="text-emerald-400 hidden sm:inline">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy size={12} />
                                <span className="hidden sm:inline">Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="relative">
                {showPreview && isRunnable ? (
                    <div className="bg-white border-b border-zinc-200 resize-y overflow-auto h-[300px]">
                        <iframe 
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-none"
                            sandbox="allow-scripts"
                            title="Code Preview"
                        />
                    </div>
                ) : (
                    <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            padding: '1.5rem',
                            backgroundColor: 'transparent',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                        wrapLongLines={true}
                    >
                        {value}
                    </SyntaxHighlighter>
                )}
            </div>
        </div>
    );
};