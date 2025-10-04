import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Define user type
type User = {
  id: string;
  email: string | null;
  isAdmin: boolean;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: {
    [key: string]: any;
    full_name?: string;
    avatar_url?: string;
    role?: string;
  };
  app_metadata?: {
    [key: string]: any;
    provider?: string;
    providers?: string[];
    role?: string;
  };
};

type AuthResponse = {
  user: User | null;
  error: any;
};

interface AuthContextType {
  currentUser: User | null;
  logout: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signInWithTikTok: () => Promise<AuthResponse>;
  signInWithMagicLink: (email: string) => Promise<AuthResponse>;
  loading: boolean;
  error: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Check active sessions and sets the user
  useEffect(() => {
    // First, check for existing session
    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
        console.log('ADMIN_EMAIL from env:', import.meta.env.VITE_ADMIN_EMAIL);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        if (session?.user) {
          const userEmail = session.user.email || null;
          console.log('Session user email:', userEmail);
          
          // Check if user is admin by email or has admin role in app_metadata
          const isAdminByEmail = userEmail === import.meta.env.VITE_ADMIN_EMAIL;
          const isAdminByRole = session.user.app_metadata?.role === 'admin';
          const isAdmin = isAdminByEmail || isAdminByRole;
          
          console.log('Admin check:', { 
            userEmail, 
            adminEmail: import.meta.env.VITE_ADMIN_EMAIL, 
            isAdminByEmail,
            isAdminByRole,
            app_metadata: session.user.app_metadata,
            isAdmin
          });
          
          const user = {
            id: session.user.id,
            email: userEmail,
            isAdmin,
            user_metadata: session.user.user_metadata || {},
            app_metadata: session.user.app_metadata || {}
          };
          
          console.log('Existing session found - User object:', JSON.stringify(user, null, 2));
          console.log('Current environment variables:', JSON.stringify(import.meta.env, null, 2));
          
          setCurrentUser(user);
        } else {
          console.log('No existing session found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Check for existing session on initial load
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const userEmail = session.user.email || null;
          
          // Use the same admin check logic as above
          const isAdminByEmail = userEmail === import.meta.env.VITE_ADMIN_EMAIL;
          const isAdminByRole = session.user.app_metadata?.role === 'admin';
          const isAdmin = isAdminByEmail || isAdminByRole;
          
          console.log('Auth state change - Admin check:', { 
            event, 
            userEmail, 
            isAdminByEmail, 
            isAdminByRole, 
            isAdmin 
          });
          
          const user = {
            id: session.user.id,
            email: userEmail,
            isAdmin,
            user_metadata: session.user.user_metadata || {},
            app_metadata: session.user.app_metadata || {}
          };
          
          console.log('User session updated:', user);
          setCurrentUser(user);
        } else {
          console.log('User signed out');
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      return { error: null };
    } catch (error) {
      console.error('Error logging out:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    try {
      setError(null);
      const siteUrl = import.meta.env.VITE_SITE_URL;
      console.log('Using site URL for OAuth:', siteUrl);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      return { user: currentUser, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const siteUrl = import.meta.env.SITE_URL || 'http://localhost:3000';
      const redirectTo = `${siteUrl}/verify-email`;
      
      console.log('Initiating magic link sign in with redirect:', redirectTo);
      
      // Use the signInWithOtp method with email configuration
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
          // This will be included in the email template
          data: {
            email: email,
            site_url: siteUrl,
            verification_url: redirectTo
          }
        },
      });
      
      // Also update the email template URL in the auth config
      await supabase.auth.updateUser({
        email,
        data: {
          email_redirect_to: redirectTo
        }
      });

      if (error) throw error;
      
      return { user: currentUser, error: null };
    } catch (error) {
      console.error('Magic link error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send magic link';
      setError(errorMessage);
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithTikTok = async (): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      // First, check if TikTok is configured in Supabase
      const { data: providers } = await supabase.auth.getUser();
      
      // Use the OAuth provider with 'tiktok' as the provider ID
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'tiktok' as any, // Type assertion as TikTok might not be in the default provider types
        options: {
          redirectTo: `${window.location.origin}/shop`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      return { user: null, error: null };
    } catch (error) {
      console.error('Error signing in with TikTok:', error);
      setError('TikTok login is not currently available. Please try another method.');
      return { 
        user: null, 
        error: new Error('TikTok login is not currently available. Please try another method.') 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser: currentUser ? {
      ...currentUser,
      full_name: currentUser.user_metadata?.full_name || '',
      avatar_url: currentUser.user_metadata?.avatar_url || ''
    } : null,
    logout,
    signInWithGoogle,
    signInWithTikTok,
    signInWithMagicLink,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}