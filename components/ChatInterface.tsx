import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './ui/Icons';
import { ChatMessage, UploadedFile } from '../types';
import { DocumentChatSession } from '../services/aiService';

interface ChatInterfaceProps {
  uploadedFile: UploadedFile | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ uploadedFile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<DocumentChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (uploadedFile) {
      // Reset chat when file changes
      setSession(new DocumentChatSession({
        base64: uploadedFile.base64,
        textContent: uploadedFile.textContent,
        mimeType: uploadedFile.mimeType
      }));
      setMessages([{
        id: 'intro',
        role: 'model',
        text: 'I\'ve analyzed your document. What would you like to know about it?',
        timestamp: Date.now()
      }]);
    }
  }, [uploadedFile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await session.sendMessage(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error answering that. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!uploadedFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white rounded-xl border border-slate-200">
        <Icons.Chat className="w-12 h-12 mb-4 opacity-50" />
        <p>Upload a document to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <Icons.Chat className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-700">Chat with Document</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-100'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-200 flex items-center gap-2">
               <Icons.Spinner className="w-4 h-4 text-indigo-600 animate-spin" />
               <span className="text-xs text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icons.Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
