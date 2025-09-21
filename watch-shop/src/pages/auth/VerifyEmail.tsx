import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        console.log('Verifying email with token:', { token, type });
        
        if (!token || type !== 'magiclink') {
          throw new Error('Invalid verification link: Missing token or incorrect type');
        }

        // First, try to verify the token
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (verifyError) {
          console.error('OTP verification error:', verifyError);
          throw verifyError;
        }

        console.log('Email verification successful:', data);

        // If we get here, verification was successful
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to the dashboard or home page after a short delay
        setTimeout(() => {
          const redirectTo = currentUser?.isAdmin ? '/admin/dashboard' : '/';
          console.log('Redirecting to:', redirectTo);
          navigate(redirectTo);
        }, 2000);

      } catch (err) {
        console.error('Email verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify email');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [navigate, searchParams, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-md transition duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-green-500 mb-4">
          <svg
            className="h-12 w-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Verified!</h2>
        <p className="text-gray-600 mb-6">Your email has been successfully verified. Redirecting you now...</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
