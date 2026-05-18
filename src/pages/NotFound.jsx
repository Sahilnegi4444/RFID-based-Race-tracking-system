import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-200 dark:text-slate-800">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mt-4">Page Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">The page you are looking for doesn't exist or has been moved.</p>
        <Link 
          to="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
