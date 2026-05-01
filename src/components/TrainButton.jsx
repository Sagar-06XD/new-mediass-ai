import React, { useState } from 'react';
import { trainModelAPI } from '../services/api';
import { BrainCircuit, CheckCircle, AlertCircle } from 'lucide-react';

export default function TrainButton({ onTrainSuccess }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null); // { success: boolean, msg: string, stats?: object }

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainResult(null);

    try {
      const data = await trainModelAPI();
      if (data.success) {
        setTrainResult({
          success: true,
          msg: 'Training completed ✅',
          stats: {
            files: data.documents_processed,
            chunks: data.chunks_created
          }
        });
        if (onTrainSuccess) onTrainSuccess();
      } else {
        setTrainResult({ success: false, msg: 'Training failed: No documents found to train on.' });
      }
    } catch (error) {
      setTrainResult({ 
        success: false, 
        msg: `Training failed ❌ (${error.response?.data?.detail || 'Server error'})` 
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 shadow-xl border border-gray-800 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BrainCircuit className="text-accent-500" /> AI Knowledge Base
        </h3>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        After uploading new documents, you must train the AI model so it can learn from them.
      </p>

      {trainResult && (
        <div className={`mb-4 p-4 rounded-lg text-sm border ${trainResult.success ? 'bg-green-900/20 border-green-800/50' : 'bg-red-900/20 border-red-800/50'}`}>
          <div className="flex items-center gap-2 mb-2 font-medium">
            {trainResult.success ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-red-400" />}
            <span className={trainResult.success ? 'text-green-400' : 'text-red-400'}>{trainResult.msg}</span>
          </div>
          {trainResult.stats && (
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-gray-900 p-2 rounded border border-gray-800">
                <div className="text-gray-500 mb-1">Documents Processed</div>
                <div className="text-lg text-gray-200 font-semibold">{trainResult.stats.files}</div>
              </div>
              <div className="bg-gray-900 p-2 rounded border border-gray-800">
                <div className="text-gray-500 mb-1">Knowledge Chunks</div>
                <div className="text-lg text-gray-200 font-semibold">{trainResult.stats.chunks}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleTrain}
        disabled={isTraining}
        className="w-full bg-accent-500 hover:bg-cyan-400 text-gray-950 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-button flex items-center justify-center gap-2"
      >
        {isTraining ? (
          <><div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> Training in progress...</>
        ) : (
          <><BrainCircuit size={20} /> Train AI Model</>
        )}
      </button>
    </div>
  );
}
