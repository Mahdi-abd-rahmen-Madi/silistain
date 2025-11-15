import logger from './logger';

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
    logger.error('Error loading image:', error);
    // Return empty string to indicate we should use the fallback
    return '';
  }
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase();
};

export const convertToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If already a WebP image, return as is
    if (file.type === 'image/webp') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP (0.8 quality for good balance between size and quality)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image to WebP'));
              return;
            }
            
            // Create a new File object with the WebP image
            const webpFile = new File(
              [blob],
              `${file.name.split('.')[0]}.webp`,
              { type: 'image/webp' }
            );
            resolve(webpFile);
          },
          'image/webp',
          0.8
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};
