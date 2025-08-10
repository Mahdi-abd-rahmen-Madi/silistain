import { supabase } from '../context/AuthContext';

const BUCKET_NAME = 'products';

// These are the default settings for the bucket
const BUCKET_CONFIG = {
  public: true,
  allowedMimeTypes: ['image/*'],
  fileSizeLimit: 5 * 1024 * 1024, // 5MB
};

/**
 * Verifies that the storage bucket is accessible
 * Note: The bucket must be created manually in the Supabase Dashboard
 * due to RLS restrictions in the free tier
 */
export async function initializeStorage() {
  try {
    // Just verify we can list the bucket contents
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
    
    // If we can list the bucket, we're good
    if (error) {
      if (error.message.includes('bucket not found')) {
        console.error(`Error: Bucket '${BUCKET_NAME}' not found. Please create it in the Supabase Dashboard.`);
        return { 
          success: false, 
          error: new Error(`Storage bucket '${BUCKET_NAME}' not found. Please create it in the Supabase Dashboard.`)
        };
      }
      throw error;
    }
    
    console.log(`Successfully connected to storage bucket: ${BUCKET_NAME}`);
    return { success: true, error: null };
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error initializing storage:', error);
    return { success: false, error };
  }
}

// Export the bucket name as a constant
export const PRODUCTS_BUCKET = BUCKET_NAME;
