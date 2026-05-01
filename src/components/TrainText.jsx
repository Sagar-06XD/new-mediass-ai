import React, { useState } from 'react';
import { trainTextAPI } from '../services/api';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function TrainText({ onTrainSuccess }) {
  const [text, setText] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);

  const handleTrain = async () => {
    if (!text.trim()) return;
    setIsTraining(true);
    setTrainResult(null);

    try {
      const data = await trainTextAPI(text);
      if (data.success) {
        setTrainResult({
          success: true,
          msg: 'Training completed ✅',
          stats: { chunks: data.chunks_created }
        });
        if (onTrainSuccess) onTrainSuccess();
        setText('');
      } else {
        setTrainResult({ success: false, msg: 'Training failed ❌' });
      }
    } catch (error) {
      setTrainResult({ 
        success: false, 
        msg: error.response?.data?.detail || 'Training failed ❌' 
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 shadow-xl border border-gray-800 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="text-brand-400" /> Train with Raw Text
        </h3>
      </div>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste medical guidelines or context here to train the AI directly..."
        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-brand-500 mb-4 min-h-[120px]"
      />

      {trainResult && (
        <div className={`mb-4 p-4 rounded-lg text-sm border ${trainResult.success ? 'bg-green-900/20 border-green-800/50' : 'bg-red-900/20 border-red-800/50'}`}>
          <div className="flex items-center gap-2 font-medium">
            {trainResult.success ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-red-400" />}
            <span className={trainResult.success ? 'text-green-400' : 'text-red-400'}>{trainResult.msg}</span>
          </div>
          {trainResult.stats && (
            <div className="mt-2 text-xs text-gray-400">
              Knowledge Chunks Created: <span className="font-semibold text-gray-200">{trainResult.stats.chunks}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleTrain}
        disabled={isTraining || !text.trim()}
        className="w-full bg-brand-500 hover:bg-brand-400 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-button flex items-center justify-center gap-2"
      >
        {isTraining ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Training in progress...</>
        ) : (
          'Train with Text'
        )}
      </button>
    </div>
  );
}
