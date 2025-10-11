import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Site URL - replace with your production URL
const siteUrl = process.env.VITE_SITE_URL || 'https://silistain.vercel.app';

// Static pages to include
const staticPages = [
  '',
  'about',
  'products',
  'contact',
  'privacy',
  'terms'
];

// Generate sitemap XML
const generateSitemap = (pages) => {
  const pagesSitemap = pages
    .map(page => {
      const path = page.replace(/^src\/pages\//, '').replace(/\.(jsx|tsx)$/, '');
      const route = path === 'index' ? '' : path;
      return `  <url>
    <loc>${siteUrl}/${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pagesSitemap}
</urlset>`;
};

// Generate sitemap
glob('src/pages/**/*.{jsx,tsx}').then((pages) => {
  const allPages = [...staticPages, ...pages];
  const sitemap = generateSitemap(allPages);
  
  writeFileSync('public/sitemap.xml', sitemap);
  console.log('Sitemap generated at public/sitemap.xml');
});
