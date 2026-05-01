import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, BarChart2, Stethoscope,
  MapPin, Tag, TrendingUp, Info
} from 'lucide-react';

const RISK_CONFIG = {
  low:    { label: 'Low', color: 'text-green-600',  bg: 'bg-green-100',  barColor: 'bg-green-500',  width: '25%' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100',  barColor: 'bg-amber-500',  width: '60%' },
  high:   { label: 'High', color: 'text-red-600',   bg: 'bg-red-100',    barColor: 'bg-red-500',    width: '95%' },
};

const NEARBY_DOCTORS = [
  { name: 'Dr. Sarah Chen', specialty: 'General Physician', rating: 4.8, distance: '0.5 km' },
  { name: 'Dr. James Wilson', specialty: 'Cardiologist', rating: 4.9, distance: '1.2 km' },
  { name: 'Dr. Maria Lopez', specialty: 'Neurologist', rating: 4.7, distance: '2.1 km' },
];

function Card({ title, icon, children, darkMode }) {
  const bg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const titleColor = darkMode ? 'text-slate-200' : 'text-gray-800';
  return (
    <div className={`rounded-2xl border p-4 ${bg} shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-500">{icon}</span>
        <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ darkMode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-blue-50'} flex items-center justify-center mb-4`}>
        <Activity size={26} className="text-blue-400" />
      </div>
      <p className={`font-semibold text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>No Insights Yet</p>
      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
        Ask a medical question to see AI-powered insights here
      </p>
    </div>
  );
}

export default function InsightsPanel({ insights, darkMode }) {
  const bg = darkMode ? 'bg-slate-900 border-slate-700/60' : 'bg-gray-50 border-gray-200';
  const text = darkMode ? 'text-slate-100' : 'text-gray-900';
  const subtext = darkMode ? 'text-slate-400' : 'text-gray-500';

  const riskCfg = insights ? (RISK_CONFIG[insights.riskLevel] || RISK_CONFIG.low) : null;

  return (
    <aside className={`w-72 h-full flex flex-col border-l ${bg} transition-colors duration-300 overflow-y-auto`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-slate-700/60' : 'border-gray-200'} flex-shrink-0`}>
        <h2 className={`font-bold text-sm ${text}`}>Medical Insights</h2>
        <p className={`text-xs mt-0.5 ${subtext}`}>AI-powered analysis</p>
      </div>

      <AnimatePresence mode="wait">
        {!insights ? (
          <EmptyState darkMode={darkMode} key="empty" />
        ) : (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 space-y-4 overflow-y-auto"
          >
            {/* Extracted Symptoms */}
            <Card title="Extracted Symptoms" icon={<Tag size={15} />} darkMode={darkMode}>
              <div className="flex flex-wrap gap-1.5">
                {(insights.symptoms || []).map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${darkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </Card>

            {/* Risk Level */}
            <Card title="Risk Assessment" icon={<AlertTriangle size={15} />} darkMode={darkMode}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${riskCfg.color}`}>{riskCfg.label} Risk</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskCfg.bg} ${riskCfg.color}`}>
                    {insights.riskLevel?.toUpperCase()}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: riskCfg.width }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-2 rounded-full ${riskCfg.barColor}`}
                  />
                </div>
              </div>
            </Card>

            {/* Confidence Score */}
            <Card title="Confidence Score" icon={<BarChart2 size={15} />} darkMode={darkMode}>
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className={`text-2xl font-bold text-blue-500`}>{insights.confidence || 80}%</span>
                  <span className={`text-xs ${subtext}`}>AI confidence</span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insights.confidence || 80}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>
            </Card>

            {/* Suggested Specialist */}
            <Card title="Suggested Specialist" icon={<Stethoscope size={15} />} darkMode={darkMode}>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={18} className="text-white" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${text}`}>{insights.specialist}</p>
                  <p className={`text-xs ${subtext}`}>Recommended specialist</p>
                </div>
              </div>
            </Card>

            {/* Nearby Doctors */}
            <Card title="Nearby Doctors" icon={<MapPin size={15} />} darkMode={darkMode}>
              <div className="space-y-2">
                {NEARBY_DOCTORS.map((doc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-xs font-semibold ${text}`}>{doc.name}</p>
                        <p className={`text-xs ${subtext}`}>{doc.specialty}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-amber-500">★ {doc.rating}</p>
                        <p className={`text-xs ${subtext}`}>{doc.distance}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className={`text-xs mt-2 text-center ${subtext}`}>Placeholder — location not tracked</p>
            </Card>

            {/* Disclaimer */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-amber-900/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <div className="flex gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  This analysis is for informational purposes only. Always consult a qualified doctor for proper diagnosis and treatment.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
