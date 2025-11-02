import { supabase } from './supabaseClient';

export const STORAGE_BUCKET = 'categories';

export const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;
    
    // Check if our bucket already exists
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true, // Make the bucket public so images can be accessed via URL
        allowedMimeTypes: ['image/*'], // Only allow image files
        fileSizeLimit: 5 * 1024 * 1024, // 5MB file size limit
      });
      
      if (createError) throw createError;
      console.log(`Successfully created bucket: ${STORAGE_BUCKET}`);
    } else {
      console.log(`Bucket ${STORAGE_BUCKET} already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

// Function to upload a category image
export const uploadCategoryImage = async (file: File, slug: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${slug}-${Date.now()}.${fileExt}`;
    const filePath = `category-images/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Function to delete a category image
export const deleteCategoryImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract the file path from the URL
    const filePath = imageUrl.split('/').pop();
    if (!filePath) throw new Error('Invalid image URL');
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([`category-images/${filePath}`]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};
