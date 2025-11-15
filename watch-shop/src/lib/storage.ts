import { supabase } from './supabaseClient';
import { uploadFile } from '../utils/supabaseStorage';

export const STORAGE_BUCKET = 'category-images';

/**
 * Uploads a category image to Supabase Storage.
 * @param file - The image file to upload
 * @param slug - A unique slug to prefix the filename (e.g., 'electronics')
 * @returns Public URL of the uploaded image, or null on failure
 */
export const uploadCategoryImage = async (file: File, slug: string): Promise<string | null> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type. Only images are allowed.');
      return null;
    }

    // Generate a unique file name
    const fileName = `${slug.trim()}-${Date.now()}`;
    const filePath = 'categories'; // Subfolder for category images

    console.log('Uploading category image...');
    
    // Use our uploadFile utility which handles WebP conversion
    const { publicUrl, error: uploadError } = await uploadFile(
      file,
      STORAGE_BUCKET,
      filePath
    );

    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return null;
    }

    if (!publicUrl) {
      console.error('Failed to retrieve public URL');
      return null;
    }

    console.log('Category image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return null;
  }
};

/**
 * Deletes a category image from Supabase Storage.
 * @param imageUrl - The full public URL of the image to delete
 * @returns true if deleted successfully, false otherwise
 */
export const deleteCategoryImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Parse the file path from the public URL
    // Supabase public URLs look like:
    // https://<project>.supabase.co/storage/v1/object/public/category-images/filename.jpg
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Expected: ['storage', 'v1', 'object', 'public', 'category-images', 'filename.jpg']
    const bucketIndex = pathSegments.indexOf('public') + 1;
    const fileNameIndex = bucketIndex + 1;

    if (bucketIndex <= 0 || fileNameIndex >= pathSegments.length) {
      console.error('Invalid public URL format:', imageUrl);
      return false;
    }

    const bucketName = pathSegments[bucketIndex];
    const fileName = pathSegments[fileNameIndex];

    if (bucketName !== STORAGE_BUCKET) {
      console.warn(`Bucket mismatch: expected "${STORAGE_BUCKET}", got "${bucketName}"`);
      // Still attempt deletion if bucket name differs, but log warning
    }

    console.log(`🗑️ Deleting file: ${fileName} from bucket: ${bucketName}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error('Delete failed:', error.message);
      return false;
    }

    console.log('✅ File deleted successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error during deletion:', error);
    return false;
  }
};