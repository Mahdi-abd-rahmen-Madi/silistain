import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a module-level cache for the clients
const clientCache = {
  supabase: null as SupabaseClient | null,
  supabaseAdmin: null as SupabaseClient | null,
};

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

// Create or return the existing Supabase client
const getSupabase = (): SupabaseClient => {
  if (!clientCache.supabase) {
    clientCache.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: createStorage(),
        storageKey: 'sb-auth-token',
      },
    });
  }
  return clientCache.supabase;
};

// Lazy-load the admin client only when needed
let adminClientPromise: Promise<SupabaseClient | null> | null = null;

const getSupabaseAdmin = async (): Promise<SupabaseClient | null> => {
  if (!supabaseServiceKey) {
    if (typeof window !== 'undefined') {
      console.warn('VITE_SUPABASE_SERVICE_ROLE_KEY is not defined. Admin features are not available.');
    }
    return null;
  }

  if (!clientCache.supabaseAdmin) {
    if (!adminClientPromise) {
      adminClientPromise = (async () => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          clientCache.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          });
          return clientCache.supabaseAdmin;
        } catch (error) {
          console.error('Failed to initialize Supabase admin client:', error);
          adminClientPromise = null;
          return null;
        }
      })();
    }
    return adminClientPromise;
  }
  
  return Promise.resolve(clientCache.supabaseAdmin);
};

// Initialize only the regular client immediately
const supabase = getSupabase();

// Export the regular client and the admin client getter
export { 
  supabase, 
  getSupabase as getClient, 
  getSupabaseAdmin as getAdminClient 
};
export default supabase;

// For debugging in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-ignore - for debugging
  window.__SUPABASE = supabase;
}
