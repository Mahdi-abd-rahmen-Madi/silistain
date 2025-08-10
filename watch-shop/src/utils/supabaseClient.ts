import { createClient } from '@supabase/supabase-js';

// Check if we're in a browser environment (not during SSR/SSG)
const isBrowser = typeof window !== 'undefined';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Only create the client once in the browser environment
const supabaseClient = isBrowser
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const supabase = supabaseClient;
