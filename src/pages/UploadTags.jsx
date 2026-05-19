import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileUp, CheckCircle, XCircle, AlertCircle, Table, X, Loader, ShieldCheck } from 'lucide-react';
import useRunnerStore from '../store/runnerStore';

import { api } from '../services/api';

export default function UploadTags() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);       // Step 1 result
  const [verifyResults, setVerifyResults] = useState({}); // { armyNumber: { verified, loading } }
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);    // all done
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState(1);        // 1=Upload 2=Verify 3=Done
  const fileInputRef = useRef(null);
  const addRunners = useRunnerStore(state => state.addRunners);

  const processFile = (f) => {
    setError(''); setVerifyResults({}); setVerified(false); setStep(1);
    if (!f.name.endsWith('.csv')) { setError('Only .csv files are accepted.'); return; }
    setFile(f);
    Papa.parse(f, {
      header: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const mapped = data
          .filter(row => row.length >= 2)
          .map(row => ({ rfid: row[0].trim(), armyNumber: row[1].trim() }));
        setParsedData(mapped);
        setStep(1);
      },
      error: (err) => setError('CSV parse error: ' + err.message),
    });
  };

  const handleVerify = async () => {
    setVerifying(true);
    setStep(2);
    // initialise all as loading
    setVerifyResults(
      Object.fromEntries(parsedData.map(r => [r.armyNumber, { loading: true, verified: false }]))
    );
    for (const runner of parsedData) {
      const res = await api.verifyRunner(runner.armyNumber);
      setVerifyResults(prev => ({
        ...prev,
        [runner.armyNumber]: { loading: false, verified: res.verified, message: res.message },
      }));
    }
    setVerifying(false);
    setVerified(true);
    setStep(3);
  };

  const handleImport = async () => {
    const toImport = parsedData
      .filter(r => verifyResults[r.armyNumber]?.verified)
      .map(r => ({
        rfid: r.rfid,
        rfid_tag: r.rfid,           // backend payload
        armyNumber: r.armyNumber,
        army_number: r.armyNumber,  // backend payload
        status: 'Running',
        verified: true,
        timestamps: { start: null, checkpoint1: null, checkpoint2: null, finish: null },
      }));

    // 1. Push to database
    await api.bulkCreateRunners(toImport);

    // 2. Add to frontend store
    addRunners(toImport);

    // reset
    setFile(null); setParsedData([]); setVerifyResults({}); setVerified(false); setStep(1);
  };

  const verifiedCount = Object.values(verifyResults).filter(v => v.verified).length;
  const rejectedCount = Object.values(verifyResults).filter(v => !v.loading && !v.verified).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--khaki-border)', boxShadow: '0 2px 12px rgba(74,92,43,0.07)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4"
          style={{ background: 'var(--army-green)', borderBottom: '2px solid var(--gold)' }}>
          <div className="p-2 rounded-lg" style={{ background: 'var(--gold)', color: '#fff' }}>
            <Upload size={18} />
          </div>
          <h2 className="text-base font-bold text-white">Upload &amp; Verify Runner Tags</h2>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  background: step >= s ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                  color: step >= s ? '#fff' : 'rgba(255,255,255,0.6)',
                }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Step 1: Drop zone ── */}
          <motion.div
            className="rounded-2xl p-10 text-center cursor-pointer select-none transition-all"
            style={{
              border: `2px dashed ${isDragging ? 'var(--army-green)' : 'var(--khaki-border)'}`,
              background: isDragging ? 'var(--army-green-pale)' : 'var(--khaki)',
              opacity: step > 1 ? 0.5 : 1,
              pointerEvents: step > 1 ? 'none' : 'auto',
            }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv"
              onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); }} />
            <FileUp size={48} className="mx-auto mb-4"
              style={{ color: isDragging ? 'var(--army-green)' : 'var(--khaki-border-dark)' }} />
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
              {file ? file.name : 'Click or drag a CSV file to upload'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Format: <span className="font-mono font-semibold">RFID Tag, Army Number</span>
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--danger-pale)', color: 'var(--danger)', border: '1px solid #f5c6c2' }}>
                <AlertCircle size={18} />{error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Step 1 → 2: Verify button ── */}
          {parsedData.length > 0 && step === 1 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'var(--success-pale)', border: '1px solid #a3d1ae' }}>
              <div className="flex items-center gap-3">
                <CheckCircle size={22} style={{ color: 'var(--success)' }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{file?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{parsedData.length} records parsed</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleVerify}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'var(--army-green)' }}>
                  <ShieldCheck size={15} /> Verify Runners
                </button>
                <button onClick={() => { setFile(null); setParsedData([]); setStep(1); }}
                  className="p-2 rounded-xl" style={{ color: 'var(--text-muted)', background: 'var(--khaki)' }}>
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2 & 3: Verification results table ── */}
          {parsedData.length > 0 && step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--khaki-border)' }}>

              {/* Summary bar */}
              {verified && (
                <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3"
                  style={{ background: 'var(--army-green-pale)', borderBottom: '1px solid var(--khaki-border)' }}>
                  <div className="flex items-center gap-4 text-sm font-semibold">
                    <span style={{ color: 'var(--success)' }}>✓ {verifiedCount} Authorized</span>
                    {rejectedCount > 0 && <span style={{ color: 'var(--danger)' }}>✗ {rejectedCount} Rejected</span>}
                  </div>
                  {verifiedCount > 0 && (
                    <button onClick={handleImport}
                      className="px-5 py-2 rounded-xl font-bold text-sm text-white"
                      style={{ background: 'var(--army-green)' }}>
                      Import {verifiedCount} Verified Runners
                    </button>
                  )}
                </div>
              )}

              {/* Per-runner verification status */}
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead style={{ background: 'var(--khaki)', position: 'sticky', top: 0 }}>
                    <tr style={{ borderBottom: '1px solid var(--khaki-border)' }}>
                      <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>#</th>
                      <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>RFID Tag</th>
                      <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Army Number</th>
                      <th className="px-4 py-2.5 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => {
                      const v = verifyResults[row.armyNumber];
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--khaki-dark)' }}>
                          <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-xs font-semibold" style={{ color: 'var(--army-green)' }}>{row.rfid}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{row.armyNumber}</td>
                          <td className="px-4 py-2.5">
                            {!v || v.loading ? (
                              <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <Loader size={13} className="animate-spin" /> Checking...
                              </span>
                            ) : v.verified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--success)' }}>
                                <CheckCircle size={13} /> Authorized
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--danger)' }}>
                                <XCircle size={13} /> Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Format guide */}
      <div className="rounded-xl p-4 text-sm"
        style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-muted)', color: 'var(--text-secondary)' }}>
        <p className="font-semibold mb-1" style={{ color: 'var(--gold)' }}>📋 CSV Format Guide</p>
        <p>Each row should contain exactly two columns: <span className="font-mono font-semibold">RFID_TAG, Army Number</span></p>
        <p className="mt-1 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>Example: TAG-1007, 14682571K</p>
      </div>
    </div>
  );
}
