import { useState, useEffect, useRef } from 'react';
import { supabase, getAdminClient } from '../../lib/supabaseClient';
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
  is_active: boolean;
  id?: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  user_id?: string;
  title?: string;
  cta_link?: string;
  product_id?: string | null;
};

export const HeroMediaManager = () => {
  const defaultHeroMedia: HeroMedia = {
    type: 'image',
    url: '',
    cta_link: '/shop',
    is_active: false
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
      
      const { data, error } = await supabase
        .from('hero_media')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
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
    setHeroMedia(prev => ({
      ...(prev || defaultHeroMedia),
      [name]: value
    }));
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
    if (isSaving || isUploading) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const currentMedia = heroMedia ? { ...heroMedia } : { ...defaultHeroMedia };
      
      // Store old URLs for cleanup
      const oldMediaUrl = currentMedia.url;
      const oldThumbnailUrl = currentMedia.thumbnail_url;
      
      // Handle file upload if a new file was selected
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
      
      // Clean up old files if they were replaced
      if (file && oldMediaUrl && oldMediaUrl !== currentMedia.url) {
        await deleteFile(oldMediaUrl);
      }
      if (thumbnailFile && oldThumbnailUrl && oldThumbnailUrl !== currentMedia.thumbnail_url) {
        await deleteFile(oldThumbnailUrl);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare data for Supabase
      const now = new Date().toISOString();
      const dataToSave = {
        type: currentMedia.type,
        url: currentMedia.url,
        thumbnail_url: currentMedia.thumbnail_url || null,
        cta_link: currentMedia.cta_link || null,
        product_id: currentMedia.product_id || null,
        title: currentMedia.title || null,
        updated_at: now,
        created_by: user?.id || null,
        user_id: user?.id || null,
        is_active: true,
        ...(currentMedia.id ? { id: currentMedia.id } : { created_at: now })
      };

      console.log('Saving data:', dataToSave);

      let result;
      if (currentMedia.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('hero_media')
          .update(dataToSave)
          .eq('id', currentMedia.id)
          .select('*')
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('hero_media')
          .insert([dataToSave])
          .select('*')
          .single();
        
        if (error) throw error;
        result = data;
      }

      // Update local state
      setHeroMedia(result);
      
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';

      toast({
        title: 'Success',
        description: 'Hero media saved successfully!',
      });
    } catch (error) {
      console.error('Error saving hero media:', error);
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

      // Get admin client to bypass RLS
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client is not available');
      }

      // Upload to the 'hero' bucket using admin client
      const { error: uploadError } = await adminClient.storage
        .from('hero')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL using admin client
      const { data: { publicUrl } } = adminClient.storage
        .from('hero')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const deleteFile = async (url: string) => {
    try {
      if (!url) return;
      
      // Get admin client to bypass RLS
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client is not available');
      }
      
      // Extract the file path from the URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const filePath = pathParts.slice(3).join('/'); // Remove the /storage/v1/object/public/ part
      
      // Delete the file using admin client
      const { error } = await adminClient.storage
        .from('hero')
        .remove([filePath]);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting file:', err);
      // Don't throw the error, as we still want to continue with the operation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading hero media...</span>
      </div>
    );
  }

  const currentHeroMedia = heroMedia || defaultHeroMedia;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-medium mb-4">Hero Content</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="product_id">Link to Product (Optional)</Label>
            <select
              id="product_id"
              name="product_id"
              value={currentHeroMedia.product_id || ''}
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
          </div>

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

          {currentHeroMedia.type === 'video' && (
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

          {(currentHeroMedia.url || currentHeroMedia.thumbnail_url) && (
            <div className="mt-4">
              <Label>Preview</Label>
              <div className="mt-2">
                {renderMediaPreview()}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="cta_link">Button Link</Label>
            <Input
              id="cta_link"
              name="cta_link"
              type="text"
              value={currentHeroMedia.cta_link || ''}
              onChange={handleInputChange}
              placeholder="/shop"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Where the CTA button should link to (e.g., /shop, /sale, /product/123)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={currentHeroMedia.is_active !== false}
              onCheckedChange={(checked) => 
                setHeroMedia(prev => ({
                  ...(prev || defaultHeroMedia),
                  is_active: checked
                }))
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHeroMedia({ ...defaultHeroMedia })}
              disabled={isSaving || isUploading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading || !currentHeroMedia.url}
            >
              {isSaving || isUploading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};
