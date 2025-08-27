import { useEffect, useState } from 'react';
import { getCachedImage, getInitials } from '@/utils/imageUtils';

interface ProfileImageProps {
  imageUrl: string;
  name: string;
  size?: number;
  className?: string;
}

export const ProfileImage = ({
  imageUrl,
  name,
  size = 40,
  className = '',
}: ProfileImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!imageUrl) {
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        const src = await getCachedImage(imageUrl, name);
        if (isMounted) {
          if (src) {
            setImageSrc(src);
          } else {
            setError(true);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imageUrl, name]);

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  if (error || !imageSrc) {
    const initials = getInitials(name);
    return (
      <div
        className={`bg-primary text-white rounded-full flex items-center justify-center font-medium ${className}`}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
};

export default ProfileImage;
