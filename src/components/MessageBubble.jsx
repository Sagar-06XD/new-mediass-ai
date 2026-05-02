import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, AlertTriangle, Lightbulb, Stethoscope,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, User, AlertCircle,
  CheckCircle, BookOpen, Tag
} from 'lucide-react';

const RISK_CONFIG = {
  low:    { color: 'text-green-600',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle size={14} />,     label: 'Low Risk' },
  medium: { color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   icon: <AlertCircle size={14} />,     label: 'Medium Risk' },
  high:   { color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       icon: <AlertTriangle size={14} />,   label: 'High Risk' },
};

function Section({ icon, title, children, darkMode, accent }) {
  const borderColor = darkMode ? 'border-slate-700' : 'border-gray-100';
  return (
    <div className={`pt-3 mt-3 border-t first:pt-0 first:mt-0 first:border-t-0 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={accent}>{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const safeStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
};

function StructuredMessage({ structured, darkMode }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const bg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const text = darkMode ? 'text-slate-100' : 'text-gray-800';
  const subtext = darkMode ? 'text-slate-400' : 'text-gray-500';
  const listItem = darkMode ? 'text-slate-300' : 'text-gray-700';
  const riskCfg = RISK_CONFIG[structured.riskLevel] || RISK_CONFIG.low;

  return (
    <div className={`rounded-2xl rounded-tl-sm border ${bg} shadow-sm overflow-hidden max-w-2xl`}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="p-4 space-y-0"
      >
        {/* Understanding */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Section icon={<Brain size={14} />} title="AI Understanding" darkMode={darkMode} accent="text-blue-500">
            <p className={`text-sm leading-relaxed ${text}`}>{safeStr(structured.understanding)}</p>
          </Section>
        </motion.div>

        {/* Symptoms */}
        {(structured.symptoms || []).length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <Section icon={<Tag size={14} />} title="Symptoms" darkMode={darkMode} accent="text-blue-500">
              <ul className="space-y-1">
                {structured.symptoms.map((s, i) => (
                  <li key={i} className={`text-sm flex items-start gap-2 ${listItem}`}>
                    <span className="text-blue-400 mt-1.5 flex-shrink-0">•</span>
                    {safeStr(s)}
                  </li>
                ))}
              </ul>
            </Section>
          </motion.div>
        )}

        {/* Possible Causes */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Section icon={<Search size={14} />} title="Possible Causes" darkMode={darkMode} accent="text-purple-500">
            <ul className="space-y-1">
              {(structured.causes || []).map((c, i) => (
                <li key={i} className={`text-sm flex items-start gap-2 ${listItem}`}>
                  <span className="text-purple-400 mt-1.5 flex-shrink-0">•</span>
                  {safeStr(c)}
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>

        {/* Risk Level */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Section icon={<AlertTriangle size={14} />} title="Risk Assessment" darkMode={darkMode} accent="text-amber-500">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${riskCfg.bg} ${riskCfg.color}`}>
              {riskCfg.icon}
              {riskCfg.label}
            </span>
          </Section>
        </motion.div>

        {/* Recommendations */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Section icon={<Lightbulb size={14} />} title="Recommendations" darkMode={darkMode} accent="text-green-500">
            <ul className="space-y-1.5">
              {(structured.recommendations || []).map((r, i) => (
                <li key={i} className={`text-sm flex items-start gap-2 ${listItem}`}>
                  <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                  {safeStr(r)}
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>

        {/* Doctor Suggestion */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
          <Section icon={<Stethoscope size={14} />} title="Suggested Specialist" darkMode={darkMode} accent="text-teal-500">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ${darkMode ? 'bg-teal-900/30 text-teal-300 border border-teal-800/50' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
              <Stethoscope size={14} />
              {safeStr(structured.doctorSuggestion || structured.specialist)}
            </div>
          </Section>
        </motion.div>

        {structured.sources?.length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <Section icon={<BookOpen size={14} />} title="References" darkMode={darkMode} accent="text-indigo-500">
              <ul className="space-y-1.5">
                {structured.sources.map((source, i) => (
                  <li key={i} className={`text-xs leading-relaxed flex items-start gap-2 ${subtext}`}>
                    <BookOpen size={12} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span>{source}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </motion.div>
        )}
      </motion.div>

      {/* Expandable Reasoning */}
      <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
        <button
          onClick={() => setShowReasoning(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors ${darkMode ? 'text-slate-400 hover:bg-slate-700/50' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span className="flex items-center gap-1.5">
            <Brain size={12} />
            Explain AI Reasoning
          </span>
          {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence>
          {showReasoning && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`px-4 pb-3 text-xs leading-relaxed ${subtext}`}>
                The AI analyzed your symptoms against a medical knowledge base using RAG (Retrieval Augmented Generation). 
                Confidence: <span className="font-semibold text-blue-500">{structured.confidence || 80}%</span>. 
                Risk assessment is based on symptom severity patterns. This is not a substitute for professional medical advice.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <div className={`border-t px-4 py-2.5 flex items-center gap-3 ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
        <span className={`text-xs ${subtext}`}>Was this helpful?</span>
        <button
          onClick={() => setFeedback('up')}
          className={`p-1.5 rounded-lg transition-colors ${feedback === 'up' ? 'bg-green-100 text-green-600' : darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={() => setFeedback('down')}
          className={`p-1.5 rounded-lg transition-colors ${feedback === 'down' ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <ThumbsDown size={14} />
        </button>
        {feedback && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs text-green-500 font-medium"
          >
            Thanks for your feedback!
          </motion.span>
        )}
      </div>
    </div>
  );
}

export default function MessageBubble({ message, darkMode, onSend }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAI = message.role === 'ai';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
      >
        <div className={`px-4 py-2 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
          {message.text}
        </div>
      </motion.div>
    );
  }

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 30,
          delay: 0.1 
        }}
        whileHover={{ scale: 1.01 }}
        className="flex gap-3 items-end flex-row-reverse"
      >
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <User size={16} className="text-white" />
        </div>
        <div className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl rounded-br-sm shadow-xl shadow-blue-900/10 max-w-md border border-white/10">
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      </motion.div>
    );
  }

  // AI message
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, x: -12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex gap-3 items-start"
    >
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/30">
        <Brain size={15} className="text-white" />
      </div>

      {message.structured ? (
        <StructuredMessage structured={message.structured} darkMode={darkMode} />
      ) : (
        <div className="flex flex-col gap-2 max-w-lg">
          <div className={`px-4 py-3 rounded-2xl rounded-tl-sm border shadow-sm w-full ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-gray-800'}`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{safeStr(message.text)}</p>
          </div>
          {message.options && message.options.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {message.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSend(opt)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${darkMode ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
