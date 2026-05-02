import React, { useState } from 'react';
import { Upload, FileText, File, Loader2, CheckCircle, AlertCircle, Server } from 'lucide-react';
import { trainTextAPI, uploadFileAPI } from '../services/api';

export default function TrainingPage() {
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'info' | 'success' | 'error', text: string }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleTrainFromFiles = async () => {
    if (files.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one file.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Uploading files...' });

    try {
      let chunks = 0;
      for (const file of files) {
        const response = await uploadFileAPI(file);
        chunks += response.chunks || 0;
      }

      setStatusMessage({ type: 'success', text: `Training completed ✅ (${chunks} chunks processed)` });
      setFiles([]);
    } catch (error) {
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to train from files. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrainFromText = async () => {
    if (!textInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter some text to train.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Training in progress... This may take a minute for large texts.' });

    // Show elapsed time so user knows it's not stuck
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setStatusMessage({ type: 'info', text: `Training in progress... (${elapsed}s elapsed)` });
    }, 1000);

    try {
      const response = await trainTextAPI(textInput);
      clearInterval(timer);
      
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      setStatusMessage({ 
        type: 'success', 
        text: response.message || `Training completed ✅ (${response.chunks || 0} chunks processed in ${elapsed}s)` 
      });
      setTextInput('');
    } catch (error) {
      clearInterval(timer);
      setStatusMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to train from text. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <Server className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            MeAssist AI Training
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            Upload medical documents or paste raw text to train the AI knowledge base.
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`rounded-xl p-4 flex items-center gap-3 border transition-all ${
            statusMessage.type === 'error' ? 'bg-red-950/50 border-red-900/50 text-red-400' :
            statusMessage.type === 'success' ? 'bg-green-950/50 border-green-900/50 text-green-400' :
            'bg-blue-950/50 border-blue-900/50 text-blue-400'
          }`}>
            {statusMessage.type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            {statusMessage.type === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
            {statusMessage.type === 'info' && <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* File Upload Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all hover:border-slate-700">
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <Upload className="h-5 w-5 text-blue-400" />
              Train from Files
            </h3>
            
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-blue-500/50 hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                  accept=".txt,.pdf,.xlsx,.xls,.csv" 
                  onChange={handleFileChange}
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <File className="mx-auto h-10 w-10 text-slate-500 mb-3" />
                <p className="text-sm font-medium text-slate-300">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">PDF, TXT, Excel (.xlsx/.xls), or CSV</p>
              </div>

              {files.length > 0 && (
                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Selected Files:</h4>
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-center gap-2">
                        <FileText className={`h-4 w-4 ${
                          file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'text-green-400' :
                          file.name.endsWith('.csv') ? 'text-yellow-400' :
                          file.name.endsWith('.pdf') ? 'text-red-400' : 'text-blue-400'
                        }`} />
                        <span className="truncate">{file.name}</span>
                        <span className="text-slate-600 text-xs ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleTrainFromFiles}
                disabled={loading || files.length === 0}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading && files.length > 0 ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                {loading && files.length > 0 ? 'Processing...' : 'Train from Files'}
              </button>
            </div>
          </div>
        </div>

        {/* Text Input Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all hover:border-slate-700">
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-purple-400" />
              Train from Text
            </h3>
            
            <div className="space-y-6">
              <div>
                <textarea
                  rows={6}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={loading}
                  placeholder="Paste medical protocols, guidelines, or raw text data here..."
                  className="block w-full rounded-xl border-0 bg-slate-950 py-3 px-4 text-slate-300 shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-600 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm sm:leading-6 disabled:opacity-50 resize-y"
                />
              </div>

              <button
                onClick={handleTrainFromText}
                disabled={loading || !textInput.trim()}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading && textInput.trim().length > 0 ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {loading && textInput.trim().length > 0 ? 'Processing...' : 'Train from Text'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
