import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Loader2, GripVertical, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { sendMessageToAI, initializeChat } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hi! I can help you summarize your notes, explain concepts, or organize your schedule.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Draggable Button State
  const [btnPos, setBtnPos] = useState({ right: 32, bottom: 32 }); // Initial: bottom-8 right-8 (32px)
  const [isDraggingBtn, setIsDraggingBtn] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const btnStartPos = useRef({ right: 0, bottom: 0 });
  const hasDragged = useRef(false);

  // Resizable Panel State
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // --- Button Dragging Logic ---
  const handleBtnMouseDown = (e: React.MouseEvent) => {
    setIsDraggingBtn(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    btnStartPos.current = { ...btnPos };
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingBtn) {
        const dx = dragStart.current.x - e.clientX; // Dragging left increases 'right'
        const dy = dragStart.current.y - e.clientY; // Dragging up increases 'bottom'
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasDragged.current = true;

        setBtnPos({
          right: Math.max(16, Math.min(window.innerWidth - 100, btnStartPos.current.right + dx)),
          bottom: Math.max(16, Math.min(window.innerHeight - 60, btnStartPos.current.bottom + dy))
        });
      }

      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX - 16; // 16px right margin
        setPanelWidth(Math.max(300, Math.min(800, newWidth)));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingBtn || isResizing) {
        setIsDraggingBtn(false);
        setIsResizing(false);
        document.body.style.userSelect = '';
      }
    };

    if (isDraggingBtn || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBtn, isResizing]);

  const handleBtnClick = () => {
    if (!hasDragged.current) {
      setIsOpen(!isOpen);
    }
  };

  // --- Chat Logic ---
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToAI(userMessage.text);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, connection error.",
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Draggable Toggle Button */}
      <button 
        className={`fixed z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ right: `${btnPos.right}px`, bottom: `${btnPos.bottom}px`, cursor: isDraggingBtn ? 'grabbing' : 'pointer' }}
        onMouseDown={handleBtnMouseDown}
        onClick={handleBtnClick}
        aria-label="Ask Effimey AI Assistant"
      >
        <div className="group flex items-center gap-2 bg-brand-light dark:bg-surface-dark p-3 pr-6 rounded-full shadow-2xl border border-outline-light dark:border-outline-dark hover:shadow-xl hover:scale-105 transition-transform active:scale-95 text-left">
            <div className="w-12 h-12 rounded-full bg-brand-red flex items-center justify-center text-white shadow-sm relative overflow-hidden">
                <Sparkles size={24} />
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-base text-slate-800 dark:text-white leading-tight">Ask Effimey</span>
                <span className="text-[10px] text-slate-500 font-medium">AI Assistant</span>
            </div>
            {/* Drag Handle Indicator */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 p-1 bg-white dark:bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                <GripVertical size={14} />
            </div>
        </div>
      </button>

      {/* Resizable Chat Panel */}
      <div
        className={`fixed inset-y-4 right-4 z-50 max-w-[calc(100vw-2rem)] bg-surface-light dark:bg-surface-dark rounded-[24px] shadow-2xl border border-outline-light dark:border-outline-dark overflow-hidden flex flex-col transition-transform duration-300 ease-out`}
        style={{ 
            width: `${panelWidth}px`,
            transform: isOpen ? 'translateX(0)' : 'translateX(calc(100% + 20px))'
        }}
        role="dialog"
        aria-label="Effimey Chat"
      >
        {/* Resizer Handle */}
        <div 
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-brand-red/50 active:bg-brand-red transition-colors z-50"
            onMouseDown={() => setIsResizing(true)}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat panel"
        ></div>

        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-outline-light dark:border-outline-dark bg-white/50 dark:bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 ml-2">
             <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center">
                <Sparkles size={18} />
             </div>
             <span className="font-bold text-base text-slate-800 dark:text-white">Notebook Guide</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close Chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-white dark:bg-surface-dark custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex items-center gap-2 mb-1 px-1`}>
                 <span className="text-[10px] font-bold text-slate-400">{msg.role === 'user' ? 'You' : 'Effimey'}</span>
              </div>
              <div
                className={`max-w-[90%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-light dark:bg-surface-dim text-slate-800 dark:text-white rounded-[20px] rounded-tr-sm shadow-sm'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-[20px] rounded-tl-sm'
                } ${msg.isError ? 'border border-red-500/50 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400' : ''}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-center gap-2 text-slate-400 px-4">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs">Thinking...</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-white/5">
          <div className="flex flex-col gap-2 bg-brand-light dark:bg-surface-dim rounded-[20px] p-2 border border-transparent focus-within:border-brand-red/50 focus-within:ring-4 focus-within:ring-brand-red/10 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question about your sources..."
              className="w-full bg-transparent border-none outline-none text-sm text-slate-800 dark:text-white px-3 py-2 max-h-32 resize-none placeholder-slate-400"
              rows={1}
              aria-label="Chat input"
            />
            <div className="flex justify-between items-center px-1 pb-1">
                <div className="flex gap-1">
                    {/* Placeholder for attachments/tools if needed later */}
                </div>
                <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-brand-red text-white rounded-full hover:bg-brand-burgundy disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-red/20"
                aria-label="Send message"
                >
                <Send size={18} />
                </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
             Effimey may display inaccurate info, please double-check responses.
          </p>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;