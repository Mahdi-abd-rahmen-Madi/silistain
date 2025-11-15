import { supabase } from '../lib/supabaseClient';
import logger from './logger';
import { convertToWebP } from './imageUtils';

export const uploadFile = async (file: File, bucket: string, path: string) => {
  try {
    // Convert to WebP if it's an image
    let uploadFile = file;
    if (file.type.startsWith('image/') && file.type !== 'image/webp') {
      try {
        uploadFile = await convertToWebP(file);
      } catch (error) {
        console.warn('Failed to convert image to WebP, uploading original:', error);
      }
    }
    
    const fileExt = uploadFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { publicUrl, filePath, error: null };
  } catch (error) {
    logger.error('Error uploading file:', error);
    return { publicUrl: null, filePath: null, error };
  }
};

export const deleteFile = async (bucket: string, path: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    logger.error('Error deleting file:', error);
    return { error };
  }
};

export const getFileUrl = (bucket: string, path: string) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
};
