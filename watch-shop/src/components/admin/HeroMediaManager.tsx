import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { useToast } from '../../hooks/use-toast';

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string;
};

type HeroMedia = {
  id?: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  user_id?: string;
  title?: string;
  subtitle?: string;
  cta_link?: string; // Only link remains — text is now hardcoded
  product_id?: string | null;
};

export const HeroMediaManager = () => {
  // Initialize with default values — cta_text removed
  const defaultHeroMedia: HeroMedia = {
    type: 'image',
    url: '',
    cta_link: '/shop' // Only link remains
  };

  const [heroMedia, setHeroMedia] = useState<HeroMedia | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
        // Clear thumbnail URL when changing media type
        ...(type === 'video' ? { thumbnail_url: undefined } : {})
      }));
    }
  };

  const renderMediaPreview = () => {
    if (!heroMedia?.url) return null;

    if (heroMedia.type === 'video') {
      return (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <video 
            src={heroMedia.url} 
            controls 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
        <img 
          src={heroMedia.url} 
          alt="Preview" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  const getAcceptedFileTypes = () => 'image/*,video/mp4,video/webm,video/quicktime';

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      setHeroMedia(prev => ({
        ...(prev || defaultHeroMedia),
        thumbnail_url: url
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchHeroMedia(),
        fetchProducts()
      ]);
    };
    fetchData();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value });
    setHeroMedia(prev => {
      const updated = {
        ...(prev || defaultHeroMedia),
        [name]: value
      };
      console.log('Updated hero media state:', updated);
      return updated;
    });
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setHeroMedia(prev => ({
      ...(prev || defaultHeroMedia),
      product_id: productId || null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) {
      console.log('Submit prevented - already saving or uploading');
      return;
    }
    
    console.log('Starting form submission');
    console.log('Current hero media state:', heroMedia);
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
      
      // Prepare the data to be saved — cta_text REMOVED
      const now = new Date().toISOString();
      const dataToSave: any = {
        type: currentMedia.type,
        url: currentMedia.url,
        thumbnail_url: currentMedia.thumbnail_url,
        // cta_text is REMOVED — no longer saved
        cta_link: currentMedia.cta_link, // Still saved if needed for routing
        product_id: currentMedia.product_id || null,
        updated_at: now,
        created_by: user?.id || null,
        user_id: user?.id,
        is_active: true
      };
      
      console.log('Data to save:', dataToSave);

      // Clean up the data object before sending
      const cleanData: Record<string, any> = {};
      Object.entries(dataToSave).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          cleanData[key] = value;
        }
      });
      
      console.log('Cleaned data to save:', cleanData);

      let error = null;
      let data = null;

      try {
        if (currentMedia.id) {
          // Update existing record
          console.log('Updating hero media with ID:', currentMedia.id);
          const { data: updatedData, error: updateError } = await supabase
            .from('hero_media')
            .update(cleanData)
            .eq('id', currentMedia.id)
            .select()
            .single();
          
          data = updatedData;
          error = updateError;
          
          if (error) throw error;
          console.log('Update successful:', data);
          toast({
            title: 'Success',
            description: 'Hero media updated successfully!',
            variant: 'default',
          });
        } else {
          // Create new record
          console.log('Creating new hero media');
          const { data: newData, error: insertError } = await supabase
            .from('hero_media')
            .insert([cleanData])
            .select()
            .single();
          
          data = newData;
          error = insertError;
          
          if (error) throw error;
          console.log('Creation successful:', data);
          toast({
            title: 'Success',
            description: 'Hero media created successfully!',
            variant: 'default',
          });
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        throw dbError;
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-medium mb-4">Hero Content</h2>
        <div className="space-y-4">
          {/* ❌ REMOVED: CTA Text Input Field */}

          <div>
            <Label htmlFor="product_id">Link to Product (Optional)</Label>
            <select
              id="product_id"
              name="product_id"
              value={heroMedia?.product_id || ''}
              onChange={handleProductSelect}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Select a product (or leave for default shop link)</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (${product.price})
                </option>
              ))}
            </select>
            {heroMedia?.product_id && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="media">Media (Image or Video)</Label>
                  <div className="mt-1 flex flex-col space-y-2">
                    <Input
                      id="media"
                      type="file"
                      onChange={handleFileChange}
                      accept={getAcceptedFileTypes()}
                      ref={fileInputRef}
                      className="cursor-pointer"
                      disabled={isUploading}
                    />
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF, MP4, WebM, MOV (max 20MB)
                    </p>
                  </div>
                </div>

                {heroMedia?.type === 'video' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="thumbnail">Video Thumbnail (Optional)</Label>
                      <span className="text-xs text-gray-500">
                        Recommended: 1280×720px
                      </span>
                    </div>
                    <Input
                      id="thumbnail"
                      type="file"
                      onChange={handleThumbnailChange}
                      accept="image/*"
                      ref={thumbnailInputRef}
                      className="mt-1"
                      disabled={isUploading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload a custom thumbnail for the video. If not provided, a thumbnail will be generated automatically.
                    </p>
                  </div>
                )}

                {heroMedia?.url && (
                  <div className="mt-4">
                    <Label>Preview</Label>
                    <div className="mt-2">
                      {renderMediaPreview()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="media" className="text-sm sm:text-base">
              {(heroMedia || defaultHeroMedia).type === 'image' ? 'Image' : 'Video'} File
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