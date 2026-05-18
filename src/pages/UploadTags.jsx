import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import useRunnerStore from '../store/runnerStore';
import { motion } from 'framer-motion';

export default function UploadTags() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const addRunners = useRunnerStore(state => state.addRunners);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (file) => {
    setError('');
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }
    setFile(file);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        // Assuming format: RFID Tag, Runner Name
        const validData = results.data.filter(row => row.length >= 2);
        const mappedData = validData.map(row => ({
          rfid: row[0].trim(),
          name: row[1].trim(),
          status: 'Running',
          timestamps: { start: null, mid1: null, mid2: null, finish: null }
        }));
        setParsedData(mappedData);
      },
      error: (error) => {
        setError('Error parsing CSV file: ' + error.message);
      }
    });
  };

  const handleImport = () => {
    if (parsedData.length > 0) {
      addRunners(parsedData);
      setFile(null);
      setParsedData([]);
      alert(`Successfully imported ${parsedData.length} runners!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Upload size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Upload Runner Tags</h2>
        </div>

        <div 
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
            isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={handleFileChange}
          />
          <FileUp size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            Click or drag CSV file to this area to upload
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Format: RFID Tag, Runner Name (e.g., TAG-1006, John Smith)
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-800">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {file && !error && (
          <div className="mt-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{file.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{parsedData.length} valid rows found</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleImport(); }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Import Runners
              </button>
            </div>

            {parsedData.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Preview
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white dark:bg-slate-950 text-slate-500 sticky top-0 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                      <tr>
                        <th className="px-4 py-3">RFID Tag</th>
                        <th className="px-4 py-3">Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-950">
                      {parsedData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{row.rfid}</td>
                          <td className="px-4 py-3 text-slate-900 dark:text-white">{row.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 50 && (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                      Showing first 50 of {parsedData.length} records
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
