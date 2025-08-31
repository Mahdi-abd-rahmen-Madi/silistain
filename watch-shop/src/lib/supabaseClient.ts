import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
};

export const supabase = createSupabaseClient();

let adminClientInstance: SupabaseClient | null = null;

export const getAdminClient = (): SupabaseClient | null => {
  if (adminClientInstance) {
    return adminClientInstance;
  }

  const adminKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!adminKey) {
    console.error('Missing Supabase service role key');
    return null;
  }
  
  adminClientInstance = createClient(supabaseUrl, adminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  return adminClientInstance;
};

export default supabase;
