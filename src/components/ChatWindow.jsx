import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import InputBox from './InputBox';
import MessageBubble from './MessageBubble';
import { Menu, PanelRight, Sun, Moon } from 'lucide-react';

function TypingIndicator({ darkMode }) {
  const bg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  return (
    <div className="flex gap-3 items-end">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
        <Brain size={16} className="text-white" />
      </div>
      <div className={`px-4 py-3 rounded-2xl rounded-bl-sm border ${bg} shadow-sm`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot`} />
          <div className={`w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot`} />
          <div className={`w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot`} />
          <span className="text-xs text-blue-500 font-medium ml-2">MeAssist AI is analyzing...</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({
  messages, isLoading, inputText, setInputText, onSend, onFileUpload,
  darkMode, onToggleDark, onToggleSidebar, onToggleInsights, isTrained
}) {
  const bottomRef = useRef(null);
  const bg = darkMode ? 'bg-slate-900' : 'bg-gray-50';
  const headerBg = darkMode ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-gray-200';
  const text = darkMode ? 'text-slate-100' : 'text-gray-900';
  const subtext = darkMode ? 'text-slate-400' : 'text-gray-500';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className={`flex-1 flex flex-col min-w-0 ${bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-5 py-3.5 border-b ${headerBg} flex-shrink-0 transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className={`font-semibold text-sm ${text}`}>Medical Consultation</h2>
            <div className="flex items-center gap-1.5">
              {isTrained ? (
                <CheckCircle2 size={12} className="text-green-500" />
              ) : (
                <AlertCircle size={12} className="text-amber-500" />
              )}
              <span className={`text-xs ${subtext}`}>{isTrained ? 'AI Ready' : 'Demo Mode'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDark}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
            title="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={onToggleInsights}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
            title="Toggle insights panel"
          >
            <PanelRight size={18} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className={`mx-auto max-w-3xl rounded-xl border px-4 py-3 flex gap-3 ${darkMode ? 'bg-amber-950/30 border-amber-800/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            MeAssist AI is an AI assistant, not a licensed doctor. It provides general information only and cannot diagnose, prescribe, or replace professional medical care. For emergencies, call 108 or seek immediate medical help.
          </p>
        </div>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} darkMode={darkMode} onSend={onSend} />
        ))}
        {isLoading && <TypingIndicator darkMode={darkMode} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`flex-shrink-0 px-4 pb-4 pt-2 border-t ${darkMode ? 'border-slate-700/60' : 'border-gray-200'}`}>
        <InputBox
          value={inputText}
          onChange={setInputText}
          onSend={onSend}
          onFileUpload={onFileUpload}
          isLoading={isLoading}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
