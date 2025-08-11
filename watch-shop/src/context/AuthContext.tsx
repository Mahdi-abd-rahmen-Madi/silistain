import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

if (!supabase) {
  throw new Error('Supabase client is not initialized');
}

// We know supabase is not null here due to the check above
const safeSupabase = supabase!;

// Define user type
type User = {
  id: string;
  email: string | null;
  isAdmin: boolean;
};

type AuthResponse = {
  user: User | null;
  error: any;
};

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<{ error: any }>;
  loading: boolean;
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
    // Check active sessions and set the user
    const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userEmail = session.user.email || null;
          const isAdmin = userEmail === import.meta.env.VITE_ADMIN_EMAIL;
          
          setCurrentUser({
            id: session.user.id,
            email: userEmail,
            isAdmin
          });
        } else {
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

  const signup = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await safeSupabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            is_admin: email === import.meta.env.VITE_ADMIN_EMAIL
          }
        }
      });

      if (error) throw error;

      const user = data.user ? {
        id: data.user.id,
        email: data.user.email || null,
        isAdmin: email === import.meta.env.VITE_ADMIN_EMAIL
      } : null;

      if (user) {
        setCurrentUser(user);
      }

      return { user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error };
    }
  }

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await safeSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user ? {
        id: data.user.id,
        email: data.user.email || null,
        isAdmin: data.user.email === import.meta.env.VITE_ADMIN_EMAIL
      } : null;

      if (user) {
        setCurrentUser(user);
      }

      return { user, error: null };
    } catch (error) {
      console.error('Error logging in:', error);
      return { user: null, error };
    }
  }

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await safeSupabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      return { error: null };
    } catch (error) {
      console.error('Error logging out:', error);
      return { error };
    }
  }

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}