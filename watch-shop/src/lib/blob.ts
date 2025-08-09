import { createClient } from '@vercel/blob';

export const uploadFile = async (file: File): Promise<{ url: string }> => {
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: file,
    headers: {
      'content-type': file.type,
      'x-vercel-filename': file.name,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return response.json();
};
