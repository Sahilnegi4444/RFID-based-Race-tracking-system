import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--khaki)' }}>
      <div className="text-center">
        <p className="text-8xl font-extrabold mb-4" style={{ color: 'var(--army-green-muted)' }}>404</p>
        <Shield size={40} className="mx-auto mb-3" style={{ color: 'var(--army-green)' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Page Not Found</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
          style={{ background: 'var(--army-green)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--army-green-dark)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--army-green)'; }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
