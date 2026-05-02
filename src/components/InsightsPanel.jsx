import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, BarChart2, Stethoscope,
  MapPin, Tag, Info, ExternalLink, Calendar, Search
} from 'lucide-react';

const RISK_CONFIG = {
  low:    { label: 'Low', color: 'text-green-600',  bg: 'bg-green-100',  barColor: 'bg-green-500',  width: '25%' },
  medium: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-100',  barColor: 'bg-amber-500',  width: '60%' },
  high:   { label: 'High', color: 'text-red-600',   bg: 'bg-red-100',    barColor: 'bg-red-500',    width: '95%' },
};

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

  const handleBookAppointment = (docName) => {
    alert(`Redirecting to appointment booking for ${docName}...`);
  };

  const handleSearchSpecialist = (specialist) => {
    window.open(`https://www.google.com/search?q=${specialist}+near+me`, '_blank');
  };

  const doctorsList = insights?.doctors?.length > 0 ? insights.doctors : [
    { name: 'Dr. Sarah Chen', specialty: insights?.specialist || 'General Physician', rating: 4.8, distance: '0.5 km' },
    { name: 'Dr. James Wilson', specialty: insights?.specialist || 'Cardiologist', rating: 4.9, distance: '1.2 km' },
  ];

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
                {(insights.symptoms || []).length > 0 ? (
                  insights.symptoms.map((s, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}
                    >
                      {s}
                    </motion.span>
                  ))
                ) : (
                  <p className={`text-xs ${subtext}`}>No specific symptoms extracted</p>
                )}
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

            {/* Suggested Specialist */}
            <Card title="Suggested Specialist" icon={<Stethoscope size={15} />} darkMode={darkMode}>
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${text}`}>{insights.specialist || 'General Physician'}</p>
                    <p className={`text-xs ${subtext}`}>Specialist</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSearchSpecialist(insights.specialist)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <Search size={14} />
                  Find Near Me
                </button>
              </div>
            </Card>

            {/* Possible Causes */}
            {insights.causes?.length > 0 && (
              <Card title="Possible Causes" icon={<BarChart2 size={15} />} darkMode={darkMode}>
                <ul className="space-y-2">
                  {insights.causes.map((cause, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} />
                      <p className={`text-[11px] leading-tight ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{cause}</p>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Recommendations */}
            {insights.recommendations?.length > 0 && (
              <Card title="Recommendations" icon={<Activity size={15} />} darkMode={darkMode}>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-2 rounded-lg border text-[11px] leading-tight ${darkMode ? 'bg-slate-700/30 border-slate-700 text-slate-300' : 'bg-green-50 border-green-100 text-green-800'}`}
                    >
                      {rec}
                    </motion.li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Nearby Doctors & Booking */}
            <Card title="Nearby Specialists" icon={<MapPin size={15} />} darkMode={darkMode}>
              <div className="space-y-3">
                {doctorsList.map((doc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className={`p-3 rounded-2xl border transition-all ${darkMode ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-700/60' : 'border-gray-100 bg-white hover:bg-gray-50'} shadow-sm`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${text}`}>{doc.name}</p>
                        <p className={`text-[10px] ${subtext} truncate`}>{doc.address || doc.specialty}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                          ★ {doc.rating || '4.5'}
                        </span>
                        <span className={`text-[9px] ${subtext}`}>0.8 km</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleBookAppointment(doc.name)}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Calendar size={12} />
                        Book Now
                      </button>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(doc.name)}`, '_blank')}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center justify-center ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        title="View on Map"
                      >
                        <MapPin size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className={`mt-4 p-3 rounded-xl border-t border-dashed ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-[10px] font-bold ${text}`}>Available Slots</p>
                  <span className="text-[9px] text-green-500 font-medium">● Live</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['10:00 AM', '11:30 AM', '02:00 PM'].map(slot => (
                    <button key={slot} className={`py-1 rounded-md text-[9px] font-medium border ${darkMode ? 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-blue-300 hover:text-blue-600'} transition-all`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </Card>


            {/* Sources */}
            {insights.sources?.length > 0 && (
              <Card title="AI Sources" icon={<ExternalLink size={15} />} darkMode={darkMode}>
                <div className="space-y-1.5">
                  {insights.sources.map((source, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-2 rounded-lg text-[10px] ${darkMode ? 'bg-slate-700/30' : 'bg-gray-100/50'}`}
                    >
                      <span className={`truncate mr-2 ${text}`}>{source}</span>
                      <ExternalLink size={12} className="text-blue-500 cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(`https://www.google.com/search?q=${source}`, '_blank')} />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Disclaimer */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-amber-900/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              <div className="flex gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed">
                  Informational only. Always consult a qualified doctor for proper diagnosis.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
