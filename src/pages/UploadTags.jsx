import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileUp, CheckCircle, AlertCircle, Table, X } from 'lucide-react';
import useRunnerStore from '../store/runnerStore';

export default function UploadTags() {
  const [file, setFile]           = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [error, setError]         = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [imported, setImported]   = useState(false);
  const fileInputRef              = useRef(null);
  const addRunners                = useRunnerStore(state => state.addRunners);

  const processFile = (f) => {
    setError('');
    setImported(false);
    if (!f.name.endsWith('.csv')) {
      setError('Only .csv files are accepted.');
      return;
    }
    setFile(f);
    Papa.parse(f, {
      header: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const mapped = data
          .filter(row => row.length >= 2)
          .map(row => ({
            rfid:        row[0].trim(),
            armyNumber:  row[1].trim(),
            status:      'Running',
            timestamps:  { start: null, mid1: null, mid2: null, finish: null },
          }));
        setParsedData(mapped);
      },
      error: (err) => setError('CSV parse error: ' + err.message),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleImport = () => {
    if (parsedData.length === 0) return;
    addRunners(parsedData);
    setImported(true);
    setTimeout(() => {
      setFile(null);
      setParsedData([]);
      setImported(false);
    }, 2000);
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setError('');
    setImported(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Card ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--khaki-border)',
          boxShadow: '0 2px 12px rgba(74,92,43,0.07)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4"
          style={{ background: 'var(--army-green)', borderBottom: '2px solid var(--gold)' }}
        >
          <div className="p-2 rounded-lg" style={{ background: 'var(--gold)', color: '#fff' }}>
            <Upload size={18} />
          </div>
          <h2 className="text-base font-bold text-white">Upload Runner Tags</h2>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Drop zone ── */}
          <motion.div
            className="rounded-2xl p-10 text-center cursor-pointer transition-all select-none"
            style={{
              border: `2px dashed ${isDragging ? 'var(--army-green)' : 'var(--khaki-border)'}`,
              background: isDragging ? 'var(--army-green-pale)' : 'var(--khaki)',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.005 }}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); }}
            />
            <FileUp
              size={48}
              className="mx-auto mb-4"
              style={{ color: isDragging ? 'var(--army-green)' : 'var(--khaki-border-dark)' }}
            />
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {isDragging ? 'Drop your CSV here' : 'Click or drag a CSV file to upload'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Format: <span className="font-mono font-semibold">RFID Tag, Runner Name</span>
            </p>
          </motion.div>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--danger-pale)', color: 'var(--danger)', border: '1px solid #f5c6c2' }}
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── File ready ── */}
          <AnimatePresence>
            {file && !error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* File info bar */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--success-pale)', border: '1px solid #a3d1ae' }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={22} style={{ color: 'var(--success)' }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {parsedData.length} valid records found
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleImport(); }}
                      className="px-5 py-2 rounded-xl font-bold text-sm text-white transition-all"
                      style={{ background: imported ? 'var(--success)' : 'var(--army-green)' }}
                    >
                      {imported ? '✓ Imported!' : 'Import Runners'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); reset(); }}
                      className="p-2 rounded-xl transition-all"
                      style={{ color: 'var(--text-muted)', background: 'var(--khaki)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Preview table */}
                {parsedData.length > 0 && (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--khaki-border)' }}
                  >
                    <div
                      className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                      style={{ background: 'var(--army-green-pale)', color: 'var(--army-green-dark)', borderBottom: '1px solid var(--khaki-border)' }}
                    >
                      <Table size={13} />
                      Preview — first {Math.min(parsedData.length, 50)} rows
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead style={{ background: 'var(--khaki)', position: 'sticky', top: 0 }}>
                          <tr style={{ borderBottom: '1px solid var(--khaki-border)' }}>
                            <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>#</th>
                            <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>RFID Tag</th>
                            <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Army Number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 50).map((row, i) => (
                            <tr
                              key={i}
                              style={{ borderBottom: '1px solid var(--khaki-dark)' }}
                            >
                              <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td className="px-4 py-2.5 font-mono text-xs font-semibold" style={{ color: 'var(--army-green)' }}>{row.rfid}</td>
                              <td className="px-4 py-2.5 font-mono font-bold text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>{row.armyNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.length > 50 && (
                      <div
                        className="px-4 py-2 text-xs text-center font-medium"
                        style={{ background: 'var(--khaki)', color: 'var(--text-muted)', borderTop: '1px solid var(--khaki-border)' }}
                      >
                        Showing 50 of {parsedData.length} records
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Help card ── */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-muted)', color: 'var(--text-secondary)' }}
      >
        <p className="font-semibold mb-1" style={{ color: 'var(--gold)' }}>📋 CSV Format Guide</p>
        <p>Each row should contain exactly two columns: <span className="font-mono font-semibold">RFID_TAG, Army Number</span></p>
        <p className="mt-1 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          Example: TAG-1007, 14682571K
        </p>
      </div>

    </div>
  );
}
