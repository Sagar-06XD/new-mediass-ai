import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, X } from 'lucide-react';

export default function EmergencyAlert({ onDismiss }) {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative z-50 bg-red-600 text-white px-4 py-3 flex items-center gap-4 shadow-lg shadow-red-900/30 emergency-shake"
    >
      {/* Pulse dot */}
      <div className="relative flex-shrink-0">
        <div className="pulse-ring" />
        <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-red-300 flex items-center justify-center">
          <AlertTriangle size={16} className="text-white" />
        </div>
      </div>

      <div className="flex-1">
        <p className="font-bold text-sm">⚠️ Medical Emergency Detected</p>
        <p className="text-xs text-red-200">Your symptoms may indicate a life-threatening condition. Call 108 or seek immediate medical help.</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-white text-red-600 font-bold text-sm px-4 py-2 rounded-xl flex-shrink-0 shadow-md"
      >
        <Phone size={14} />
        Call 108
      </motion.button>

      <button
        onClick={onDismiss}
        className="p-1.5 rounded-lg hover:bg-red-500 transition-colors flex-shrink-0"
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
