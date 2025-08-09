import { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { Readable } from 'stream';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: VercelRequest): Promise<{ fields: any; files: any }> => {
  const form = new formidable.IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files?.file) ? files.file[0] : files?.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate a unique filename with timestamp and original extension
    const timestamp = Date.now();
    const uniqueFilename = `products/${timestamp}-${file.originalFilename || 'file'}`;

    // Convert file to buffer
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = file as unknown as Readable;
      
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Upload the file to Vercel Blob
    const blob = await put(uniqueFilename, fileBuffer, { 
      access: 'public',
      contentType: file.mimetype || 'application/octet-stream',
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
