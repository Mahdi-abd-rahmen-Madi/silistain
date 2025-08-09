const { put } = require('@vercel/blob');
const formidable = require('formidable');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Read file content
    const fs = require('fs');
    const fileContent = fs.readFileSync(file.filepath);

    // Upload to Vercel Blob
    const blob = await put(
      `products/${Date.now()}-${file.originalFilename}`,
      fileContent,
      { access: 'public', contentType: file.mimetype }
    );

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
};
