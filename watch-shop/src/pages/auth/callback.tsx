import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for OAuth callback with hash
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');

        // Handle magic link verification
        if (token && type === 'magiclink') {
          // Redirect to the verification page with the token
          navigate(`/verify-email?token=${encodeURIComponent(token)}&type=magiclink`);
          return;
        }
        
        if (hash) {
          // Handle OAuth callback with hash (Google, GitHub, etc.)
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) throw error;
            
            // Clear the URL hash to remove tokens from the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to the shop or the originally requested page
            const redirectTo = searchParams.get('redirect_to') || '/shop';
            navigate(redirectTo);
            return;
          }
        }
        
        // If we have a valid session, redirect to the dashboard
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionData.session) {
          const redirectTo = searchParams.get('redirect_to') || '/shop';
          navigate(redirectTo);
          return;
        }
        
        // If we get here, something went wrong with the auth flow
        console.error('Auth callback error: No valid session found');
        navigate('/login?error=invalid_auth');
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login?error=invalid_auth');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
