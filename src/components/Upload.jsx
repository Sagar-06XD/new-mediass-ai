import React, { useState, useRef } from 'react';
import { uploadFileAPI } from '../services/api';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function Upload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setUploadStatus(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setUploadStatus(null);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus({ type: 'error', message: 'Please select a file first.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      // Upload files sequentially for simplicity, or we could do Promise.all
      let successCount = 0;
      for (const file of files) {
        await uploadFileAPI(file);
        successCount++;
      }
      setUploadStatus({ type: 'success', message: `Successfully uploaded ${successCount} file(s).` });
      setFiles([]);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus({ type: 'error', message: error.response?.data?.detail || 'Failed to upload files. Is backend running?' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 shadow-xl border border-gray-800">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <UploadCloud className="text-brand-400" /> Upload Knowledge
      </h3>
      
      <div 
        className="border-2 border-dashed border-gray-700 hover:border-brand-500 rounded-xl p-8 text-center transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          accept=".pdf,.txt,.xlsx,.xls,.csv"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <UploadCloud size={40} className="text-gray-500" />
          <p><span className="text-brand-400 font-medium">Click to upload</span> or drag and drop</p>
          <p className="text-xs">PDF, TXT, Excel (.xlsx / .xls), CSV</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-900 px-3 py-2 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-sm truncate">
                <FileIcon size={16} className={`flex-shrink-0 ${
                  file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'text-green-400' :
                  file.name.endsWith('.csv') ? 'text-yellow-400' :
                  file.name.endsWith('.pdf') ? 'text-red-400' : 'text-gray-400'
                }`} />
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadStatus && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${uploadStatus.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
          {uploadStatus.type === 'success' ? <CheckCircle size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
          <span>{uploadStatus.message}</span>
        </div>
      )}

      <button 
        onClick={handleUpload} 
        disabled={isUploading || files.length === 0}
        className="w-full mt-4 bg-brand-500 hover:bg-brand-400 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-button flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
        ) : (
          'Upload Files'
        )}
      </button>
    </div>
  );
}
