import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { useToast } from '../../hooks/use-toast';

type HeroMedia = {
  id?: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  user_id?: string;
};

export const HeroMediaManager = () => {
  // Initialize with default values
  const defaultHeroMedia: HeroMedia = {
    type: 'image',
    url: ''
  };

  const [heroMedia, setHeroMedia] = useState<HeroMedia | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' as const : 'image' as const;
      
      setHeroMedia(prev => ({
        ...(prev || defaultHeroMedia),
        url,
        type
      }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      setHeroMedia(prev => ({
        ...(prev || defaultHeroMedia),
        thumbnail_url: url,
        type: prev?.type || defaultHeroMedia.type,
        url: prev?.url || defaultHeroMedia.url
      }));
    }
  };

  useEffect(() => {
    fetchHeroMedia();
  }, []);

  const fetchHeroMedia = async () => {
    try {
      setIsLoading(true);
      
      // Get the most recent hero media
      const { data, error } = await supabase
        .from('hero_media')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching hero media:', error);
        throw error;
      }

      // If we have data, set it, otherwise use default values
      setHeroMedia(data || { ...defaultHeroMedia });
    } catch (error) {
      console.error('Error fetching hero media:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hero media',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) {
      console.log('Submit prevented - already saving or uploading');
      return;
    }
    
    console.log('Starting form submission');
    setIsSaving(true);
    setError(null);

    try {
      // Get the current media data or use defaults
      const currentMedia = heroMedia ? { ...heroMedia } : { ...defaultHeroMedia };
      
      // Handle main file upload if a file was selected
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        setIsUploading(true);
        try {
          const publicUrl = await handleFileUpload(file, 'hero-media');
          currentMedia.url = publicUrl;
        } finally {
          setIsUploading(false);
        }
      }

      // Handle thumbnail upload for videos
      const thumbnailFile = thumbnailInputRef.current?.files?.[0];
      if (thumbnailFile) {
        setIsUploading(true);
        try {
          const thumbnailUrl = await handleFileUpload(thumbnailFile, 'hero-media/thumbnails');
          currentMedia.thumbnail_url = thumbnailUrl;
        } finally {
          setIsUploading(false);
        }
      }

      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare the data to be saved
      const now = new Date().toISOString();
      const dataToSave: Omit<HeroMedia, 'id' | 'created_at' | 'updated_at' | 'created_by'> & {
        id?: string;
        created_at?: string;
        updated_at: string;
        created_by?: string | null;
      } = {
        type: currentMedia.type,
        url: currentMedia.url,
        thumbnail_url: currentMedia.thumbnail_url,
        updated_at: now,
        created_by: user?.id || null,
        user_id: user?.id
      };

      // Remove any undefined values to avoid overwriting with null in the database
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === undefined) {
          delete dataToSave[key as keyof typeof dataToSave];
        }
      });

      let error = null;
      let data = null;

      if (currentMedia.id) {
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('hero_media')
          .update(dataToSave)
          .eq('id', currentMedia.id)
          .select()
          .single();
        
        data = updateData;
        error = updateError;
      } else {
        // Create new record
        const { data: insertData, error: insertError } = await supabase
          .from('hero_media')
          .insert([{ ...dataToSave, created_at: now }])
          .select()
          .single();
        
        data = insertData;
        error = insertError;
      }

      if (error) {
        console.error('Error saving hero media:', error);
        throw error;
      }

      // Update the local state with the saved data
      setHeroMedia(data);
      
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';

      toast({
        title: 'Success',
        description: 'Hero media saved successfully',
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to save hero media',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      console.log('Uploading file to bucket: hero, path:', filePath);
      
      // Use the existing 'hero' bucket instead of 'hero-media'
      const { error: uploadError } = await supabase.storage
        .from('hero')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully. Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };


  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading hero media...</span>
      </div>
    );
  }

  // Use default values if heroMedia is still null
  const currentHeroMedia = heroMedia || defaultHeroMedia;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Hero Media</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage the hero section on the home page
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="media-type" className="text-sm sm:text-base">Media Type</Label>
            <select
              id="media-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={currentHeroMedia.type}
              onChange={(e) =>
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  type: e.target.value as 'image' | 'video'
                }))
              }
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="media" className="text-sm sm:text-base">
              {currentHeroMedia.type === 'image' ? 'Image' : 'Video'} File
            </Label>
            <div className="relative">
              <Input
                id="media"
                type="file"
                ref={fileInputRef}
                accept={currentHeroMedia.type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="text-xs sm:text-sm py-2 h-auto min-h-10"
              />
            </div>
            {currentHeroMedia.url && (
              <div className="mt-2">
                {currentHeroMedia.type === 'image' ? (
                  <img
                    src={currentHeroMedia.url}
                    alt="Preview"
                    className="max-h-40 w-auto max-w-full rounded-md"
                  />
                ) : (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {currentHeroMedia.url}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentHeroMedia.type === 'video' && (
            <div className="space-y-1.5">
              <Label htmlFor="thumbnail" className="text-sm sm:text-base">Thumbnail (Optional)</Label>
              <div className="relative">
                <Input
                  id="thumbnail"
                  type="file"
                  ref={thumbnailInputRef}
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="text-xs sm:text-sm py-2 h-auto min-h-10"
                />
              </div>
              {currentHeroMedia.thumbnail_url && (
                <div className="mt-2">
                  <img
                    src={currentHeroMedia.thumbnail_url}
                    alt="Thumbnail Preview"
                    className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md border border-gray-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={isUploading || isSaving}
            className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base"
          >
            {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
