import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Plus, MessageSquare, Clock, User, ChevronRight,
  Server
} from 'lucide-react';

const HISTORY = [
  { id: 1, title: 'Headache & Dizziness', time: '2 hours ago', risk: 'medium' },
  { id: 2, title: 'Chest Pain Assessment', time: 'Yesterday', risk: 'high' },
  { id: 3, title: 'Common Cold Symptoms', time: '3 days ago', risk: 'low' },
  { id: 4, title: 'Fatigue & Weakness', time: '1 week ago', risk: 'low' },
];

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function Sidebar({ darkMode, onNewConsultation, isTrained, currentView, setCurrentView }) {
  const bg = darkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-gray-200';
  const text = darkMode ? 'text-slate-100' : 'text-gray-900';
  const subtext = darkMode ? 'text-slate-400' : 'text-gray-500';
  const hoverBg = darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50';
  const histBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100';

  return (
    <aside className={`w-64 h-full flex flex-col border-r ${bg} transition-colors duration-300`}>
      {/* Logo */}
      <div className="p-5 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${text}`}>Mediass AI</h1>
            <p className={`text-xs ${subtext}`}>Medical Assistant</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-4 pt-4">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${isTrained ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'} ${darkMode ? '!bg-opacity-10 !border-opacity-30' : ''}`}>
          <span className={`w-2 h-2 rounded-full ${isTrained ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
          {isTrained ? 'AI Trained & Ready' : 'AI Not Trained'}
        </div>
      </div>

      {/* New Consultation */}
      <div className="px-4 pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewConsultation}
          className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30"
        >
          <Plus size={18} />
          New Consultation
        </motion.button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>Recent Consultations</p>
        {HISTORY.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`w-full text-left px-3 py-3 rounded-xl border ${histBg} ${hoverBg} transition-all group`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${text}`}>{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={11} className={subtext} />
                  <span className={`text-xs ${subtext}`}>{item.time}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${RISK_COLORS[item.risk]}`}>
                {item.risk}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Navigation */}
      <div className={`px-4 py-3 border-t border-inherit`}>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>Navigation</p>
        <div className="space-y-1">
          <button 
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${currentView === 'chat' ? 'bg-blue-100 text-blue-700' : `${hoverBg} ${subtext}`}`}
          >
            <MessageSquare size={15} />
            Chat Assistant
          </button>
          <button 
            onClick={() => setCurrentView('training')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${currentView === 'training' ? 'bg-blue-100 text-blue-700' : `${hoverBg} ${subtext}`}`}
          >
            <Server size={15} />
            Training Data
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className={`p-4 border-t border-inherit`}>
        <div className={`flex items-center gap-3 p-3 rounded-xl ${hoverBg} cursor-pointer transition-colors group`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${text}`}>User</p>
            <p className={`text-xs truncate ${subtext}`}>Free Plan</p>
          </div>
          <ChevronRight size={16} className={`${subtext} group-hover:translate-x-0.5 transition-transform`} />
        </div>
      </div>
    </aside>
  );
}
