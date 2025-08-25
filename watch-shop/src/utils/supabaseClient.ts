import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a type-safe storage implementation
const createStorage = () => ({
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  },
});

// Create the main Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: createStorage(),
    storageKey: 'sb-auth-token',
  },
});

// Create admin client if service key is available
let supabaseAdmin: SupabaseClient | null = null;

if (supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Supabase admin client:', error);
  }
} else if (typeof window !== 'undefined') {
  console.warn('VITE_SUPABASE_SERVICE_ROLE_KEY is not defined. Admin features will be limited.');
}

export { supabase, supabaseAdmin };
export default supabase;

// For debugging in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-ignore - for debugging
  window.__SUPABASE = supabase;
}
