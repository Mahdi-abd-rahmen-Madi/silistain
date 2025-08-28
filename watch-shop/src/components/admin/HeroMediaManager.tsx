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
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  user_id?: string;
};

export const HeroMediaManager = () => {
  // Initialize with default values
  const defaultHeroMedia: HeroMedia = {
    type: 'image',
    url: '',
    is_active: true,
    title: '',
    subtitle: '',
    cta_text: 'Shop Now',
    cta_link: '/shop'
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
        type,
        title: prev?.title || defaultHeroMedia.title,
        subtitle: prev?.subtitle || defaultHeroMedia.subtitle,
        cta_text: prev?.cta_text || defaultHeroMedia.cta_text,
        cta_link: prev?.cta_link || defaultHeroMedia.cta_link,
        is_active: prev?.is_active ?? defaultHeroMedia.is_active
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
        title: prev?.title || defaultHeroMedia.title,
        type: prev?.type || defaultHeroMedia.type,
        url: prev?.url || defaultHeroMedia.url,
        subtitle: prev?.subtitle || defaultHeroMedia.subtitle,
        cta_text: prev?.cta_text || defaultHeroMedia.cta_text,
        cta_link: prev?.cta_link || defaultHeroMedia.cta_link,
        is_active: prev?.is_active ?? defaultHeroMedia.is_active
      }));
    }
  };

  useEffect(() => {
    fetchHeroMedia();
  }, []);

  const fetchHeroMedia = async () => {
    try {
      setIsLoading(true);
      
      // First try to get the active hero media
      const { data, error } = await supabase
        .from('hero_media')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching hero media:', error);
        throw error;
      }

      // If we have data, set it, otherwise use default values
      setHeroMedia(data || { ...defaultHeroMedia });
      
      // If no active media found, try to get any media
      if (!data) {
        const { data: anyMedia } = await supabase
          .from('hero_media')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (anyMedia) {
          setHeroMedia(anyMedia);
        }
      }
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

      // If this is a new active hero media, deactivate others
      if (currentMedia.is_active) {
        let query = supabase
          .from('hero_media')
          .update({ is_active: false });
          
        // If we have an ID, exclude it from the update
        if (currentMedia.id) {
          query = query.neq('id', currentMedia.id);
        } else {
          // If no ID, ensure we don't update all records by adding a condition that's always true
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error: deactivateError } = await query;

        if (deactivateError) {
          console.error('Error deactivating other media:', deactivateError);
          throw deactivateError;
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
        ...currentMedia,
        updated_at: now,
      };

      // For new records, set created_at and created_by
      // Ensure created_by is set for new records
      if (!currentMedia.id) {
        const { data: { user } } = await supabase.auth.getUser();
        currentMedia.created_by = user?.id || null;
      }

      console.log('Saving hero media data:', dataToSave);
      
      // Insert or update the hero media
      const { data, error: upsertError } = await supabase
        .from('hero_media')
        .upsert(dataToSave)
        .select()
        .single();

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        throw upsertError;
      }
      
      if (!data) {
        const error = new Error('No data returned from upsert');
        console.error(error);
        throw error;
      }

      console.log('Successfully saved hero media:', data);
      
      // Update local state with the saved data
      const updatedMedia = {
        ...data,
        // Ensure all required fields are present
        title: data.title || '',
        subtitle: data.subtitle || '',
        cta_text: data.cta_text || 'Shop Now',
        cta_link: data.cta_link || '/shop',
        is_active: data.is_active ?? false,
        type: data.type || 'image',
        url: data.url || ''
      };
      
      console.log('Updating local state with:', updatedMedia);
      setHeroMedia(updatedMedia);

      // Clear file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';

      toast({
        title: 'Success',
        description: 'Hero media saved successfully',
      });

    } catch (err) {
      console.error('Error saving hero media:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to save hero media: ${errorMessage}`,
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hero Media</h2>
        <p className="text-muted-foreground">
          Manage the hero section on the home page
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media-type">Media Type</Label>
            <select
              id="media-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="space-y-2">
            <Label htmlFor="media-file">
              {currentHeroMedia.type === 'image' ? 'Image' : 'Video'} File
            </Label>
            <Input
              id="media"
              type="file"
              ref={fileInputRef}
              accept={currentHeroMedia.type === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileChange}
            />
            {currentHeroMedia.url && (
              <div className="mt-2">
                {currentHeroMedia.type === 'image' ? (
                  <img
                    src={currentHeroMedia.url}
                    alt="Preview"
                    className="max-h-40 rounded-md"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {currentHeroMedia.url}
                  </p>
                )}
              </div>
            )}
          </div>

          {currentHeroMedia.type === 'video' && (
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                ref={thumbnailInputRef}
                accept="image/*"
                onChange={handleThumbnailChange}
              />
              {currentHeroMedia.thumbnail_url && (
                <div className="mt-2">
                  <img
                    src={currentHeroMedia.thumbnail_url}
                    alt="Thumbnail Preview"
                    className="h-20 w-20 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={currentHeroMedia.title}
              onChange={(e) =>
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  title: e.target.value
                }))
              }
              placeholder="Enter title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={currentHeroMedia.subtitle || ''}
              onChange={(e) =>
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  subtitle: e.target.value
                }))
              }
              placeholder="Enter subtitle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta_text">Button Text</Label>
            <Input
              id="cta_text"
              value={currentHeroMedia.cta_text}
              onChange={(e) =>
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  cta_text: e.target.value
                }))
              }
              placeholder="e.g. Shop Now"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta_link">Button Link</Label>
            <Input
              id="cta_link"
              value={currentHeroMedia.cta_link}
              onChange={(e) =>
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  cta_link: e.target.value
                }))
              }
              placeholder="e.g. /shop"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={currentHeroMedia.is_active}
              onCheckedChange={(checked) =>
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  is_active: checked as boolean
                }))
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>

        <Button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
};
