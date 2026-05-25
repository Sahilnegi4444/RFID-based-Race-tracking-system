import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Lock, User, Shield } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useRaceStore from '../store/raceStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();
  const resetActiveState = useRaceStore(state => state.resetActiveState);

  useEffect(() => {
    resetActiveState();
  }, [resetActiveState]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500)); // simulate latency
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use admin / admin.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'var(--khaki)' }}
    >
      {/* Decorative background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{ background: 'var(--army-green-muted)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'var(--gold-muted)' }}
        />
        {/* Subtle diagonal stripes pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #4a5c2b 0, #4a5c2b 1px, transparent 0, transparent 50%)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="p-4 rounded-2xl shadow-lg"
              style={{ background: 'var(--army-green)', color: '#fff' }}
            >
              <Radio size={36} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            RFID Race Tracking
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            🏅 Indian Army — Admin Control Center
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--khaki-border)',
            boxShadow: '0 4px 32px rgba(74,92,43,0.10)',
          }}
        >
          {/* Gold accent bar */}
          <div
            className="h-1 rounded-full mb-8 -mt-2 mx-auto w-16"
            style={{ background: 'var(--gold)' }}
          />

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl text-sm text-center font-medium"
                style={{
                  background: 'var(--danger-pale)',
                  color: 'var(--danger)',
                  border: '1px solid #f5c6c2',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Username
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: 'var(--khaki)',
                    border: '1.5px solid var(--khaki-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--army-green)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,92,43,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--khaki-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: 'var(--khaki)',
                    border: '1.5px solid var(--khaki-border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--army-green)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,92,43,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--khaki-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all mt-2"
              style={{ background: loading ? 'var(--army-green-light)' : 'var(--army-green)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--army-green-dark)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--army-green)'; }}
            >
              {loading ? 'Authenticating…' : 'Sign In to Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Demo credentials: <span className="font-mono font-semibold" style={{ color: 'var(--army-green)' }}>admin / admin</span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          <Shield size={12} className="inline mr-1" />
          Secured — Internal Network Only
        </p>
      </motion.div>
    </div>
  );
}
