import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Music, Code, File as FileIcon, Mic, MicOff, Camera, Aperture } from 'lucide-react';
import { Attachment } from '../types';

// Declare global type for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Default to English, but many browsers auto-detect

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        if (textareaRef.current) {
             textareaRef.current.style.height = 'auto';
             textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser.");
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Camera Logic
  const startCamera = async () => {
      try {
          setShowCamera(true);
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err) {
          console.error("Camera Error:", err);
          alert("Could not access camera. Please allow permissions.");
          setShowCamera(false);
      }
  };

  const stopCamera = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
      setShowCamera(false);
  };

  const capturePhoto = () => {
      if (videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              const [header, data] = dataUrl.split(',');
              const mimeType = header.split(':')[1].split(';')[0];
              
              setAttachments(prev => [...prev, {
                  type: 'image',
                  data: data,
                  mimeType: mimeType,
                  fileName: `cipher_vision_${Date.now()}.png`
              }]);
          }
      }
      stopCamera();
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const [header, data] = base64String.split(',');
        const mimeType = header.split(':')[1].split(';')[0];
        
        let type: 'image' | 'file' = 'file';
        if (mimeType.startsWith('image/')) type = 'image';

        setAttachments(prev => [...prev, { 
            type, 
            data, 
            mimeType, 
            fileName: file.name 
        }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
  };

  const renderAttachmentPreview = (att: Attachment) => {
      if (att.mimeType.startsWith('image/')) {
          return (
            <img 
                src={`data:${att.mimeType};base64,${att.data}`} 
                alt="preview" 
                className="h-16 w-16 object-cover rounded-lg border border-zinc-300"
            />
          );
      }
      
      let Icon = FileIcon;
      if (att.mimeType.includes('pdf')) Icon = FileText;
      else if (att.mimeType.includes('audio')) Icon = Music;
      else if (att.mimeType.includes('text') || att.mimeType.includes('javascript') || att.mimeType.includes('json')) Icon = Code;

      return (
          <div className="h-16 w-16 bg-zinc-100 rounded-lg border border-zinc-300 flex flex-col items-center justify-center p-1">
              <Icon size={20} className="text-emerald-600 mb-1" />
              <span className="text-[8px] text-zinc-600 w-full text-center truncate px-1">{att.fileName}</span>
          </div>
      );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-4 transition-colors duration-300">
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl w-full max-w-lg">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto aspect-video object-cover" />
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 border-[2px] border-emerald-500/30 m-4 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border border-emerald-500/50 rounded-full animate-ping"></div>
                    </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent">
                    <button onClick={stopCamera} className="p-3 text-white bg-zinc-800/80 rounded-full hover:bg-zinc-700">
                        <X size={20} />
                    </button>
                    <button onClick={capturePhoto} className="p-4 bg-white rounded-full border-4 border-zinc-800 shadow-lg hover:scale-105 transition-transform">
                        <div className="w-4 h-4 bg-black rounded-full"></div>
                    </button>
                    <div className="w-12"></div> {/* Spacer */}
                </div>
            </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 px-2 overflow-x-auto">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative group shrink-0">
              {renderAttachmentPreview(att)}
              <button 
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar - FORCED WHITE BACKGROUND FOR CONTRAST IN DARK MODE */}
      <div className="relative flex items-end gap-2 bg-white p-2 rounded-2xl border border-zinc-200 shadow-lg transition-all duration-300">
        
        {/* Upload Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100 rounded-xl transition-colors"
          disabled={isLoading}
          title="Attach images, code, PDF, or audio"
        >
          <Paperclip size={20} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,audio/*,application/pdf,text/*,.js,.py,.ts,.tsx,.jsx,.html,.css,.json,.md" 
          onChange={handleFileChange}
        />

        {/* Camera Button */}
        <button
            onClick={startCamera}
            className="p-3 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 rounded-xl transition-colors hidden xs:block"
            disabled={isLoading}
            title="Cipher Vision (Camera)"
        >
            <Camera size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Ask Cipher anything..."
          className="flex-1 bg-transparent text-zinc-900 placeholder-zinc-500 text-sm p-3 focus:outline-none resize-none max-h-48 overflow-y-auto font-light leading-relaxed"
          rows={1}
          disabled={isLoading}
        />

        {/* Microphone Button */}
        <button 
          onClick={toggleListening}
          className={`p-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
             isListening 
             ? 'bg-red-500/10 text-red-500' 
             : 'text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100'
          }`}
          title="Voice Input"
        >
          {isListening ? (
             <>
               <span className="absolute inset-0 rounded-xl border border-red-500 animate-ping opacity-30"></span>
               <MicOff size={20} />
             </>
          ) : (
             <Mic size={20} />
          )}
        </button>

        <button 
          onClick={handleSend}
          disabled={isLoading || (!input.trim() && attachments.length === 0)}
          className={`p-3 rounded-xl transition-all duration-300 ${
             isLoading || (!input.trim() && attachments.length === 0)
             ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
             : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
          }`}
        >
          <Send size={20} />
        </button>
      </div>
      <div className="text-center mt-3">
         <p className="text-[9px] md:text-[10px] text-zinc-400 dark:text-zinc-600 font-mono tracking-wider uppercase opacity-60">
             Cipher // Unrestricted Intelligence
         </p>
      </div>
    </div>
  );
};
