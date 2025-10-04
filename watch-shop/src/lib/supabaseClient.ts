import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    console.log('Initializing Supabase client with site URL:', siteUrl);
    
    const authOptions: any = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce' as const,
        debug: true,
        storage: window.localStorage,
        storageKey: 'sb-auth-token',
      },
      global: {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    };

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, authOptions);
    
    // Override the redirectTo URL for all auth methods
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
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
