const imageCache = new Map<string, string>();

export const getCachedImage = async (url: string, name: string): Promise<string> => {
  // Check if image is in cache
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  try {
    // For Google profile pictures, use the URL directly
    if (url.includes('googleusercontent.com')) {
      imageCache.set(url, url);
      return url;
    }

    // For other images, use the proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const data = await response.json();
    const imageUrl = data.contents;
    
    // Cache the successful response
    imageCache.set(url, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error loading image:', error);
    // Return empty string to indicate we should use the fallback
    return '';
  }
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase();
};
