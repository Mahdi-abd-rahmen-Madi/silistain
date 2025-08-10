import { useState, useEffect } from 'react';
import { supabase } from '../context/AuthContext';
import { initializeStorage, PRODUCTS_BUCKET } from '../utils/initStorage';

type UploadResponse = {
  publicUrl: string | null;
  filePath: string | null;
  error: Error | null;
};

type DeleteResponse = {
  error: Error | null;
};

export function useStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize storage on component mount
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        const { success, error: initError } = await initializeStorage();
        
        if (!isMounted) return;
        
        if (initError) {
          console.error('Storage initialization error:', initError);
          setError(initError as Error);
        } else if (success) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error('Failed to initialize storage');
        console.error('Unexpected error initializing storage:', error);
        setError(error);
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const uploadFile = async (file: File, path: string = ''): Promise<UploadResponse> => {
    if (!isInitialized) {
      const error = new Error('Storage not initialized');
      setError(error);
      return { publicUrl: null, filePath: null, error };
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create a unique file path with timestamp
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      
      console.log('Uploading file to bucket:', PRODUCTS_BUCKET, 'path:', filePath);
      
      const { data, error: uploadError } = await supabase.storage
        .from(PRODUCTS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(PRODUCTS_BUCKET)
        .getPublicUrl(filePath);

      return { publicUrl, filePath, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload file');
      setError(error);
      return { publicUrl: null, filePath: null, error };
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (filePath: string): Promise<DeleteResponse> => {
    if (!isInitialized) {
      const error = new Error('Storage not initialized');
      setError(error);
      return { error };
    }

    setIsDeleting(true);
    setError(null);
    
    console.log('Deleting file from bucket:', PRODUCTS_BUCKET, 'path:', filePath);
    
    try {
      const { error: deleteError } = await supabase.storage
        .from(PRODUCTS_BUCKET)
        .remove([filePath]);

      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete file');
      setError(error);
      return { error };
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileUrl = (path: string): string => {
    if (!isInitialized) {
      console.error('Storage not initialized');
      return '';
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(PRODUCTS_BUCKET)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    isUploading,
    isDeleting,
    error,
    isInitialized,
  };
}

export default useStorage;
