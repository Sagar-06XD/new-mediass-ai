import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Loader2 } from 'lucide-react';

export default function InputBox({ value, onChange, onSend, onFileUpload, isLoading, darkMode }) {
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const bg = darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300';
  const textColor = darkMode ? 'text-slate-100 placeholder-slate-500' : 'text-gray-900 placeholder-gray-400';
  const btnHover = darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500';

  return (
    <div className={`flex items-end gap-2 p-2 rounded-2xl border ${bg} shadow-sm transition-colors duration-200`}>
      {/* File upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`p-2.5 rounded-xl ${btnHover} transition-colors flex-shrink-0`}
        title="Attach file (PDF, TXT, Excel, CSV)"
        disabled={isLoading}
      >
        <Paperclip size={18} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Text input */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe your symptoms or ask a health question..."
        rows={1}
        className={`flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed py-2.5 px-1 max-h-32 ${textColor}`}
        style={{ minHeight: '40px' }}
        disabled={isLoading}
      />

      {/* Send button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSend(value)}
        disabled={isLoading || !value?.trim()}
        className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 ${
          value?.trim() && !isLoading
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25'
            : darkMode
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </motion.button>
    </div>
  );
}
