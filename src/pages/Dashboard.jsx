import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Timer, Trophy, Activity, MapPin, Clock } from 'lucide-react';
import useRunnerStore from '../store/runnerStore';
import useSettingsStore from '../store/settingsStore';

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, accentColor, accentPale, pulse, subtitle }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(74,92,43,0.12)' }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--khaki-border)',
        boxShadow: '0 2px 8px rgba(74,92,43,0.06)',
      }}
    >
      <div
        className="p-3 rounded-xl relative shrink-0"
        style={{ background: accentPale, color: accentColor }}
      >
        <Icon size={22} />
        {pulse && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accentColor }} />
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: accentColor }} />
          </span>
        )}
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
  const isRunning = status === 'Running';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: isRunning ? 'var(--army-green-pale)' : 'var(--gold-pale)',
        color: isRunning ? 'var(--army-green)' : 'var(--gold)',
        border: `1px solid ${isRunning ? 'var(--army-green-muted)' : 'var(--gold-muted)'}`,
      }}
    >
      {isRunning && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: 'var(--army-green)' }}
        />
      )}
      {status}
    </span>
  );
}

// ── Timestamp cell ─────────────────────────────────────────────────────────
function TsCell({ value }) {
  if (!value) return (
    <span className="font-mono text-xs" style={{ color: 'var(--khaki-border-dark)' }}>—</span>
  );
  return (
    <span className="font-mono text-xs font-medium" style={{ color: 'var(--army-green-dark)' }}>{value}</span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { runners, simulateLiveUpdates } = useRunnerStore();
  const checkpoints = useSettingsStore(state => state.checkpoints);

  useEffect(() => {
    const interval = setInterval(simulateLiveUpdates, 2000);
    return () => clearInterval(interval);
  }, [simulateLiveUpdates]);

  const active   = runners.filter(r => r.status === 'Running').length;
  const finished = runners.filter(r => r.status === 'Finished').length;

  const cpLabels = ['Start', 'Mid1', 'Mid2', 'Finish'].slice(0, checkpoints);
  const cpKeys   = ['start', 'mid1', 'mid2', 'finish'].slice(0, checkpoints);

  return (
    <div className="space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Runners"
          value={runners.length}
          icon={Users}
          accentColor="var(--army-green)"
          accentPale="var(--army-green-pale)"
        />
        <StatCard
          title="Active Now"
          value={active}
          icon={Activity}
          accentColor="var(--success)"
          accentPale="var(--success-pale)"
          pulse
          subtitle="Running on course"
        />
        <StatCard
          title="Finished"
          value={finished}
          icon={Trophy}
          accentColor="var(--gold)"
          accentPale="var(--gold-pale)"
        />
        <StatCard
          title="Checkpoints"
          value={checkpoints}
          icon={MapPin}
          accentColor="var(--warning)"
          accentPale="var(--warning-pale)"
          subtitle="Active gates"
        />
      </div>

      {/* ── Live Table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--khaki-border)',
          boxShadow: '0 2px 12px rgba(74,92,43,0.07)',
        }}
      >
        {/* Table header bar */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'var(--army-green)',
            borderBottom: '2px solid var(--gold)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400" />
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">Live Race Status</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--gold-muted)' }}>
            <Clock size={13} />
            Updates every 2s
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr style={{ background: 'var(--army-green-pale)', borderBottom: '2px solid var(--khaki-border)' }}>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>RFID Tag</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>Army Number</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>Status</th>
                {cpLabels.map(col => (
                  <th key={col} className="px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--army-green-dark)' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runners.map((runner, index) => (
                <motion.tr
                  key={runner.rfid}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  style={{ borderBottom: '1px solid var(--khaki-dark)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--army-green-pale)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold" style={{ color: 'var(--army-green)' }}>
                    {runner.rfid}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-sm tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    {runner.armyNumber}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={runner.status} />
                  </td>
                  {cpKeys.map(key => (
                    <td key={key} className="px-6 py-4">
                      <TsCell value={runner.timestamps[key]} />
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-xs font-medium flex items-center justify-between"
          style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', borderTop: '1px solid var(--khaki-border)' }}
        >
          <span>{runners.length} total participants</span>
          <span>{finished} completed · {active} on course</span>
        </div>
      </div>
    </div>
  );
}
