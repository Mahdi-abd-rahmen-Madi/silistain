import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL which contains the access token
        const hash = window.location.hash;
        if (hash) {
          // Parse the hash to get the access token
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');
          
          if (type === 'magiclink' && accessToken && refreshToken) {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) throw error;
            
            // Get the current session to verify
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
              throw new Error('Failed to establish session');
            }
            
            // Clear the URL hash to remove tokens from the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to the shop or the originally requested page
            const redirectTo = searchParams.get('redirect_to') || '/shop';
            navigate(redirectTo);
            return;
          }
        }
        
        // If we get here, something went wrong with the auth flow
        navigate('/login?error=invalid_auth');
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-gray-900">Signing you in...</p>
        <p className="mt-2 text-sm text-gray-600">Please wait while we verify your session.</p>
      </div>
    </div>
  );
}
