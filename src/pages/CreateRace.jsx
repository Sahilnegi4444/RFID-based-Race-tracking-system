import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, MapPin, Settings as SettingsIcon, Signal, Flag, PlusCircle } from 'lucide-react';
import useSettingsStore from '../store/settingsStore';
import useRaceStore from '../store/raceStore';
import { motion } from 'framer-motion';

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ icon: Icon, iconColor, iconBg, title, children }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--khaki-border)',
        boxShadow: '0 2px 10px rgba(74,92,43,0.07)',
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '2px solid var(--khaki-border)', background: 'var(--army-green-pale)' }}
      >
        <div className="p-2 rounded-lg" style={{ background: iconBg, color: iconColor }}>
          <Icon size={18} />
        </div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function CreateRace() {
  const navigate = useNavigate();
  const { checkpoints, setCheckpoints, raceTitle, setRaceTitle, readers } = useSettingsStore();
  const {
    raceType, setRaceType,
    raceCustomName, setRaceCustomName,
    raceStatus, raceSessionId,
    createRaceSession,
  } = useRaceStore();

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const cpOptions = [
    { value: 2, label: '2', desc: 'Start → Checkpoint 1' },
    { value: 3, label: '3', desc: 'Start → Checkpoint 1 → Checkpoint 2' },
    { value: 4, label: '4', desc: 'Start → Checkpoint 1 → Checkpoint 2 → Finish' },
  ];

  const raceTypes = ['BPT', 'PPT', 'CPT', 'others'];

  const signalBars = (signal) => {
    const levels = { strong: 4, good: 3, fair: 2, weak: 1, none: 0 };
    const filled = levels[signal] ?? 0;
    return Array.from({ length: 4 }, (_, i) => i < filled);
  };

  const handleCreateRace = async () => {
    if (raceType === 'others' && !raceCustomName.trim()) {
      setCreateError('Please enter a custom race name.');
      return;
    }
    setCreateError('');
    setCreating(true);
    try {
      await createRaceSession();
      navigate('/upload-tags');
    } catch (err) {
      setCreateError('Failed to create race session. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const raceAlreadyExists = raceSessionId !== null || raceStatus === 'active' || raceStatus === 'finished';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--khaki-border)', boxShadow: '0 2px 10px rgba(74,92,43,0.07)' }}>
        <div>
          <h1 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>Create Race</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Configure race type, checkpoints, and RFID reader settings before uploading runners.
          </p>
        </div>

        {raceAlreadyExists ? (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'var(--success-pale)', color: 'var(--success)', border: '1.5px solid #a3d1ae' }}>
            ✓ Race Created
          </span>
        ) : (
          <motion.button
            id="btn-create-race"
            onClick={handleCreateRace}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: creating ? 'var(--army-green-muted)' : 'var(--army-green)', opacity: creating ? 0.7 : 1 }}
            whileHover={{ scale: creating ? 1 : 1.03 }}
            whileTap={{ scale: creating ? 1 : 0.97 }}
          >
            <PlusCircle size={16} />
            {creating ? 'Creating…' : 'Create Race'}
          </motion.button>
        )}
      </div>

      {/* Error message */}
      {createError && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--danger-pale)', color: 'var(--danger)', border: '1px solid #f5c6c2' }}>
          {createError}
        </div>
      )}

      {/* ── Race Configuration ── */}
      <Section icon={Flag} iconColor="var(--gold)" iconBg="var(--gold-pale)" title="Race Configuration">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Race Type</label>
            <div className="flex flex-wrap gap-3">
              {raceTypes.map(type => {
                const active = raceType === type;
                return (
                  <button key={type} onClick={() => setRaceType(type)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: active ? 'var(--gold)' : 'var(--khaki)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${active ? 'var(--gold)' : 'var(--khaki-border)'}`,
                      boxShadow: active ? '0 2px 8px rgba(139,105,20,0.25)' : 'none',
                    }}>
                    {type === 'others' ? 'Others' : type}
                  </button>
                );
              })}
            </div>
          </div>
          {raceType === 'others' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Custom Race Name</label>
              <input type="text" placeholder="e.g. Annual Cross Country 2025"
                value={raceCustomName}
                onChange={e => setRaceCustomName(e.target.value)}
                className="w-full sm:w-96 px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                style={{ background: 'var(--khaki)', border: '1.5px solid var(--khaki-border)', color: 'var(--text-primary)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--khaki-border)'; }}
              />
            </div>
          )}
        </div>
      </Section>

      <Section icon={SettingsIcon} iconColor="var(--army-green)" iconBg="var(--army-green-pale)" title="System Configuration">
        <div className="space-y-6">

          {/* Race Title */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Race Title
            </label>
            <input
              type="text"
              value={raceTitle}
              onChange={e => setRaceTitle(e.target.value)}
              className="w-full sm:w-96 px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
              style={{
                background: 'var(--khaki)',
                border: '1.5px solid var(--khaki-border)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--army-green)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,92,43,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--khaki-border)'; e.target.style.boxShadow = 'none'; }}
            />
            <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>Displayed in the top navigation bar.</p>
          </div>

          {/* Checkpoint count */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Number of Checkpoints
            </label>
            <div className="flex flex-wrap gap-3">
              {cpOptions.map(opt => {
                const active = checkpoints === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCheckpoints(opt.value)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: active ? 'var(--army-green)' : 'var(--khaki)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: `1.5px solid ${active ? 'var(--army-green)' : 'var(--khaki-border)'}`,
                      boxShadow: active ? '0 2px 8px rgba(74,92,43,0.25)' : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div
              className="mt-3 px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium"
              style={{ background: 'var(--army-green-pale)', color: 'var(--army-green-dark)' }}
            >
              <MapPin size={14} />
              {cpOptions.find(o => o.value === checkpoints)?.desc}
            </div>
          </div>

        </div>
      </Section>

      {/* ── RFID Reader Status ── */}
      <Section icon={Signal} iconColor="var(--gold)" iconBg="var(--gold-pale)" title="RFID Reader Status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {readers.slice(0, checkpoints).map((reader, idx) => {
            const online = reader.status === 'online';
            const bars   = signalBars(reader.signal);
            return (
              <motion.div
                key={reader.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{
                  background: online ? 'var(--success-pale)' : 'var(--danger-pale)',
                  border: `1.5px solid ${online ? '#a3d1ae' : '#f5c6c2'}`,
                }}
              >
                {/* Left: icon + name */}
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-full"
                    style={{
                      background: online ? 'var(--success)' : 'var(--danger)',
                      color: '#fff',
                    }}
                  >
                    {online ? <Wifi size={16} /> : <WifiOff size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {reader.name}
                    </p>
                    {/* Signal bars */}
                    <div className="flex items-end gap-0.5 mt-1">
                      {bars.map((filled, i) => (
                        <div
                          key={i}
                          className="rounded-sm"
                          style={{
                            width: '4px',
                            height: `${(i + 1) * 4}px`,
                            background: filled
                              ? (online ? 'var(--success)' : 'var(--danger)')
                              : 'var(--khaki-border)',
                          }}
                        />
                      ))}
                      <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{reader.signal}</span>
                    </div>
                  </div>
                </div>

                {/* Right: status pill */}
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                  style={{
                    background: online ? 'var(--success)' : 'var(--danger)',
                    color: '#fff',
                  }}
                >
                  {reader.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </Section>

    </div>
  );
}
