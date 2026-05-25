import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Cpu, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import useRaceStore from '../store/raceStore';
import useRunnerStore from '../store/runnerStore';

export default function RfidSerialConnector({ checkpointsCount }) {
  const [supported, setSupported] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lastTag, setLastTag] = useState('');
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [scanMessage, setScanMessage] = useState('');
  
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const keepReadingRef = useRef(true);

  const { raceSessionId, raceStatus } = useRaceStore();
  const loadRunners = useRunnerStore(state => state.loadRunners);

  // Check for Web Serial support
  useEffect(() => {
    if (!navigator.serial) {
      setSupported(false);
      setStatusMessage('Web Serial API not supported in this browser. Please use Chrome or Edge.');
    }
  }, []);

  // Gracefully close port on unmount
  useEffect(() => {
    return () => {
      disconnectPort();
    };
  }, []);

  const connectPort = async () => {
    if (!supported) return;
    setConnecting(true);
    setStatusMessage('Selecting USB port...');
    
    try {
      // Request user to select COM Port
      const port = await navigator.serial.requestPort();
      portRef.current = port;

      setStatusMessage('Opening connection (9600 baud)...');
      await port.open({ baudRate: 9600 });
      
      setConnected(true);
      setConnecting(false);
      setStatusMessage('RFID Reader Ready & Listening');
      keepReadingRef.current = true;

      // Start asynchronous read loop
      readLoop();
    } catch (err) {
      console.error('[Serial] Connection failed:', err);
      setConnected(false);
      setConnecting(false);
      setStatusMessage(`Error: ${err.message || 'Access denied'}`);
    }
  };

  const disconnectPort = async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (err) {
        console.error('[Serial] Cancel reader error:', err);
      }
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (err) {
        console.error('[Serial] Port close error:', err);
      }
      portRef.current = null;
    }

    setConnected(false);
    setStatusMessage('Disconnected');
    setLastTag('');
    setScanMessage('');
  };

  const readLoop = async () => {
    const textDecoder = new TextDecoderStream();
    const port = portRef.current;
    
    if (!port || !port.readable) return;
    
    // Pipe the serial reader stream to a text decoder stream
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    readerRef.current = reader;

    let buffer = '';
    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        // Split by newlines (Arduino Serial.println output format)
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          const tag = line.trim();
          if (tag) {
            handleRfidScan(tag);
          }
        }
      }
    } catch (err) {
      console.error('[Serial] Read loop error:', err);
      setStatusMessage(`Read Error: ${err.message}`);
    } finally {
      reader.releaseLock();
      try {
        await readableStreamClosed;
      } catch (err) {
        // Ignore pipe cancellation errors
      }
    }
  };

  const handleRfidScan = async (tag) => {
    // Clean tag by removing common prefixes like "TAG UID:", "Card UID:", "UID:" (case-insensitive)
    const cleanTag = tag.replace(/^(TAG\s+)?(CARD\s+)?UID:\s*/i, '').trim();

    setLastTag(cleanTag);
    setScanMessage(`Scanning tag: ${cleanTag}...`);

    if (!raceSessionId) {
      setScanMessage(`Tag read: ${cleanTag} (Ignored: No active race)`);
      return;
    }

    if (raceStatus !== 'active') {
      setScanMessage(`Tag read: ${cleanTag} (Ignored: Race is not started)`);
      return;
    }

    try {
      // Post scan to backend. The backend auto-advances checkpoints start->cp1->cp2->finish
      const res = await api.recordCheckpoint(cleanTag, 'start', new Date().toISOString(), raceSessionId);
      if (res) {
        setScanMessage(`✓ Registered scan: ${cleanTag}`);
        // Immediately reload dashboard state so the scanned tag reflects live
        await loadRunners(checkpointsCount);
      } else {
        setScanMessage(`⚠ Failed to record: Tag ${cleanTag} not registered to any runner`);
      }
    } catch (err) {
      console.error('[Serial] API record failed:', err);
      setScanMessage(`⚠ Error: ${err.message}`);
    }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--khaki-border)', 
        boxShadow: '0 2px 10px rgba(74,92,43,0.07)' 
      }}>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Cpu className="text-gold" size={20} />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Real RFID Reader
          </h3>
        </div>
        
        {supported && (
          <button
            onClick={connected ? disconnectPort : connectPort}
            disabled={connecting}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5"
            style={{ 
              background: connected ? 'var(--danger)' : 'var(--army-green)',
              opacity: connecting ? 0.7 : 1,
              cursor: connecting ? 'not-allowed' : 'pointer'
            }}
          >
            {connecting ? (
              <>
                <Loader className="animate-spin" size={12} />
                Connecting...
              </>
            ) : connected ? (
              <>
                <WifiOff size={12} />
                Disconnect
              </>
            ) : (
              <>
                <Wifi size={12} />
                Connect Reader
              </>
            )}
          </button>
        )}
      </div>

      {!supported ? (
        <div className="rounded-xl p-3 text-xs flex gap-2" style={{ background: 'rgba(192,57,43,0.08)', color: 'var(--danger)' }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>{statusMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status info */}
          <div className="rounded-xl p-3 text-xs space-y-1.5" style={{ background: 'var(--army-green-pale)', border: '1px solid var(--khaki-border)' }}>
            <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--army-green-dark)' }}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {connected ? 'Reader Active' : 'Disconnected'}
            </div>
            <p style={{ color: 'var(--text-muted)' }}>{statusMessage}</p>
            {connected && (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                * Using 1-Reader Testing Mode: Scanning a tag repeatedly cycles it through all checkpoints.
              </p>
            )}
          </div>

          {/* Scan info */}
          <div className="rounded-xl p-3 text-xs flex flex-col justify-between" style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-muted)' }}>
            <div>
              <span className="font-bold text-[10px] uppercase tracking-wider block" style={{ color: 'var(--gold)' }}>
                Live Stream monitor
              </span>
              <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                {scanMessage || 'Waiting for first scan...'}
              </p>
            </div>
            {lastTag && (
              <div className="flex items-center gap-1.5 mt-2 font-mono text-[10px]" style={{ color: 'var(--gold)' }}>
                <CheckCircle size={10} />
                Last scanned: <span className="font-bold">{lastTag}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
