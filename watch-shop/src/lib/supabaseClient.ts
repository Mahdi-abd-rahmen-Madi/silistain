import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Create a single supabase client for interacting with your database
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = import.meta.env.VITE_SITE_URL ;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
let supabaseInstance: SupabaseClient | null = null;

const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    logger.debug('Initializing Supabase client with site URL:', siteUrl);
    
    const isDev = import.meta.env.DEV;
    
    const authOptions: any = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce' as const,
        debug: isDev, // Only enable debug in development
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
      logger.debug('Auth state changed:', { event, user: session?.user?.email });
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
    logger.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Admin features are not available.');
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
