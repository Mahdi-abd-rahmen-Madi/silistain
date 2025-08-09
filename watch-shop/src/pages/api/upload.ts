import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function upload(request: NextRequest) {
  if (request.method !== 'POST') {
    return new NextResponse('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = request.headers.get('x-vercel-filename') || file.name || 'file';
    const contentType = request.headers.get('content-type') || file.type;
    const fileType = `.${contentType.split('/')[1]}`;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Generate a unique filename with timestamp and original extension
    const timestamp = Date.now();
    const uniqueFilename = `products/${timestamp}-${filename}${fileType}`;

    // Upload the file to Vercel Blob
    const blob = await put(uniqueFilename, file, { 
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return new NextResponse('Upload failed', { status: 500 });
  }
}
