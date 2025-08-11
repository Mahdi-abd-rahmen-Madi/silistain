import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Check if we're in a browser environment (not during SSR/SSG)
const isBrowser = typeof window !== 'undefined';

// Define the global type for our supabase client
declare global {
  var __supabase: SupabaseClient | undefined;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create or return the existing Supabase client
const getSupabaseClient = (): SupabaseClient | null => {
  if (!isBrowser) return null;
  
  // Create the client if it doesn't exist on the global object
  if (!globalThis.__supabase) {
    globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    
    if (import.meta.env.DEV) {
      // For debugging in development
      console.log('Created new Supabase client instance');
    }
  }
  
  return globalThis.__supabase;
};

// Export the Supabase client
export const supabase = getSupabaseClient();

// For debugging
if (import.meta.env.DEV && isBrowser) {
  // @ts-ignore - for debugging
  window.__SUPABASE = supabase;
}
