import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

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

  // Check active sessions and sets the user
  useEffect(() => {
    // Check active sessions and set the user
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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

    return () => subscription.unsubscribe();
  }, []);

  async function signup(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
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

  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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

  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
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