import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

// Define user type
type User = {
  id: string;
  email: string | null;
  isAdmin: boolean;
  user_metadata?: {
    [key: string]: any;
    full_name?: string;
    avatar_url?: string;
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          const userEmail = session.user.email || null;
          const isAdmin = userEmail === import.meta.env.VITE_ADMIN_EMAIL;
          
          const user = {
            id: session.user.id,
            email: userEmail,
            isAdmin,
            user_metadata: session.user.user_metadata || {},
          };
          
          console.log('Existing session found:', user);
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
          const isAdmin = userEmail === import.meta.env.VITE_ADMIN_EMAIL;
          
          const user = {
            id: session.user.id,
            email: userEmail,
            isAdmin,
            user_metadata: session.user.user_metadata || {},
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
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/shop`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
      
      // The OAuth flow will redirect the user, so we don't need to do anything else here
      // The auth state change listener will handle updating the user state after the redirect
      return { user: null, error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error);
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    logout,
    signInWithGoogle,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}