import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, MapPin, Clock, Play, Square, Download } from 'lucide-react';
import useRunnerStore from '../store/runnerStore';
import useSettingsStore from '../store/settingsStore';
import useRaceStore from '../store/raceStore';

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, accentColor, accentPale, subtitle }) {
  return (
    <motion.div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--khaki-border)', boxShadow: '0 2px 10px rgba(74,92,43,0.07)' }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(74,92,43,0.12)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-3 rounded-xl" style={{ background: accentPale, color: accentColor }}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</p>
        <p className="text-2xl font-extrabold mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </motion.div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    Running: { bg: 'var(--army-green-pale)', color: 'var(--army-green)', border: 'var(--army-green-muted)', dot: 'var(--army-green)' },
    Finished: { bg: 'var(--gold-pale)', color: 'var(--gold)', border: 'var(--gold-muted)', dot: 'var(--gold)' },
    default: { bg: 'var(--khaki)', color: 'var(--text-muted)', border: 'var(--khaki-border)', dot: 'var(--text-muted)' },
  };
  const s = cfg[status] || cfg.default;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

// ── Timestamp cell ─────────────────────────────────────────────────────────
function TsCell({ value }) {
  if (!value) return <span className="font-mono text-xs" style={{ color: 'var(--khaki-border-dark)' }}>—</span>;
  return <span className="font-mono text-xs font-medium" style={{ color: 'var(--army-green-dark)' }}>{value}</span>;
}

// ── Elapsed time helper (start → last configured checkpoint) ────────────────
// Returns "HH:MM:SS" string, or null if data is missing.
function calcElapsed(startTs, endTs) {
  if (!startTs || !endTs) return null;
  const toSec = (ts) => { const [h, m, s] = ts.split(':').map(Number); return h * 3600 + m * 60 + (s || 0); };
  const diff = toSec(endTs) - toSec(startTs);
  if (diff <= 0) return null;
  const hh = Math.floor(diff / 3600);
  const mm = Math.floor((diff % 3600) / 60);
  const ss = diff % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// ── Export CSV ───────────────────────────────────────────────────────────────────
function exportCSV(runners, cpKeys, cpLabels, raceLabel) {
  const lastKey = cpKeys[cpKeys.length - 1];
  const headers = ['Rank', 'Army Number', 'RFID Tag', ...cpLabels, 'Total Time (HH:MM:SS)', 'Status'];
  const rows = runners.map((r, i) => [
    i + 1,
    r.armyNumber,
    r.rfid,
    ...cpKeys.map(k => r.timestamps[k] || '-'),
    calcElapsed(r.timestamps.start, r.timestamps[lastKey]) || '-',
    r.status,
  ]);
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: `race_${raceLabel}_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  a.click();
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { runners, simulateLiveUpdates } = useRunnerStore();
  const checkpoints = useSettingsStore(state => state.checkpoints);
  const { raceStatus, raceType, raceCustomName, startRace, finishRace, raceLabel } = useRaceStore();

  // Simulation only runs when race is active
  useEffect(() => {
    if (raceStatus !== 'active') return;
    const interval = setInterval(() => simulateLiveUpdates(checkpoints), 2000);
    return () => clearInterval(interval);
  }, [raceStatus, simulateLiveUpdates, checkpoints]);

  const active = runners.filter(r => r.status === 'Running').length;
  const finished = runners.filter(r => r.status === 'Finished').length;

  const cpLabels = ['Start', 'Checkpoint 1', 'Checkpoint 2', 'Finish'].slice(0, checkpoints);
  const cpKeys = ['start', 'checkpoint1', 'checkpoint2', 'finish'].slice(0, checkpoints);
  const label = raceLabel();

  return (
    <div className="space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Runners" value={runners.length} icon={Activity}
          accentColor="var(--army-green)" accentPale="var(--army-green-pale)" />
        <StatCard title="Active" value={active} icon={Activity}
          accentColor="var(--army-green)" accentPale="var(--army-green-pale)"
          subtitle="Currently running" />
        <StatCard title="Finished" value={finished} icon={CheckCircle}
          accentColor="var(--gold)" accentPale="var(--gold-pale)" />
        <StatCard title="Checkpoints" value={checkpoints} icon={MapPin}
          accentColor="var(--warning)" accentPale="var(--warning-pale)"
          subtitle="Active gates" />
      </div>

      {/* ── Race control bar ── */}
      <div className="rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--khaki-border)', boxShadow: '0 2px 10px rgba(74,92,43,0.07)' }}>

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {raceStatus === 'idle' && (
            <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              Race not started — upload runners and press Start
            </span>
          )}
          {raceStatus === 'active' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold"
              style={{ background: 'var(--army-green-pale)', color: 'var(--army-green)' }}>
              <span className="animate-ping w-2 h-2 rounded-full inline-block" style={{ background: 'var(--army-green)' }} />
              RACE LIVE — {label}
            </span>
          )}
          {raceStatus === 'finished' && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold"
              style={{ background: 'var(--gold-pale)', color: 'var(--gold)' }}>
              RACE FINISHED — {label}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {raceStatus === 'idle' && runners.length > 0 && (
            <motion.button
              onClick={startRace}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ background: 'var(--army-green)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Play size={16} fill="white" /> Start Race
            </motion.button>
          )}
          {raceStatus === 'active' && (
            <motion.button
              onClick={finishRace}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ background: 'var(--danger)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Square size={16} fill="white" /> End Race
            </motion.button>
          )}
          {(raceStatus === 'finished' || finished > 0) && (
            <motion.button
              onClick={() => exportCSV(runners, cpKeys, cpLabels, label)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'var(--gold-pale)', color: 'var(--gold)', border: '1.5px solid var(--gold-muted)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Download size={16} /> Export CSV
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Live Leaderboard ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--khaki-border)', boxShadow: '0 2px 12px rgba(74,92,43,0.07)' }}>

        {/* Header bar */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--army-green)', borderBottom: '2px solid var(--gold)' }}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={`${raceStatus === 'active' ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75`} />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">Live Leaderboard</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--gold-muted)' }}>
            <Clock size={13} /> {raceStatus === 'active' ? 'Updates every 2s' : 'Race not active'}
          </div>
        </div>

        {runners.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              No runners yet — upload a CSV file from the Upload Tags page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ background: 'var(--army-green-pale)', borderBottom: '2px solid var(--khaki-border)' }}>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>#</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>Army Number</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>RFID Tag</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>Status</th>
                  {cpLabels.map(col => (
                    <th key={col} className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>{col}</th>
                  ))}
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>Total Time</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {runners.map((runner, index) => (
                    <motion.tr
                      key={runner.armyNumber}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 }, duration: 0.25 }}
                      style={{ borderBottom: '1px solid var(--khaki-dark)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--army-green-pale)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-4 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>{runner.armyNumber}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold" style={{ color: 'var(--army-green)' }}>{runner.rfid}</td>
                      <td className="px-6 py-4"><StatusBadge status={runner.status} /></td>
                      {cpKeys.map(key => (
                        <td key={key} className="px-6 py-4"><TsCell value={runner.timestamps[key]} /></td>
                      ))}
                      <td className="px-6 py-4">
                        {(() => {
                          // Show total time only once runner has crossed the last DISPLAYED checkpoint
                          const lastKey = cpKeys[cpKeys.length - 1];
                          const elapsed = calcElapsed(runner.timestamps.start, runner.timestamps[lastKey]);
                          return elapsed
                            ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold font-mono"
                              style={{ background: 'var(--gold-pale)', color: 'var(--gold)', border: '1px solid var(--gold-muted)' }}>
                              {elapsed}
                            </span>
                            : <span className="font-mono text-xs" style={{ color: 'var(--khaki-border-dark)' }}>—</span>;
                        })()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
