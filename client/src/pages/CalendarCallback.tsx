import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * This page is now a simple landing page after the backend completes
 * the OAuth token exchange and redirects here with ?success=true or ?error=auth_failed.
 * The backend handles ALL token exchange logic — no sensitive code touches the frontend.
 */
export default function CalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  useEffect(() => {
    // Auto-redirect to calendar page after a short delay
    const timer = setTimeout(() => {
      navigate('/calendar', { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={32} className="text-red-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Connection Failed</p>
            <p className="text-gray-500 text-sm">Could not connect to Google Calendar. Redirecting...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
              {success ? 'Calendar Connected!' : 'Connecting...'}
            </p>
            <p className="text-gray-500 text-sm">Redirecting to your calendar...</p>
          </>
        )}
      </div>
    </div>
  );
}
