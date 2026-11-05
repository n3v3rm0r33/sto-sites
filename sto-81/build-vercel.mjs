import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const domain = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
if (!domain) throw new Error('Set SITE_URL or enable Vercel system environment variables before building.');
const url = new URL(domain.includes('://') ? domain : `https://${domain}`);
if (url.protocol !== 'https:') throw new Error('The production site must use HTTPS.');
const origin = url.origin;
const out = join(root, 'public');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const assets = ['style.css','dark.css','sign.css','reviews.css','classic.css','gallery.js','classic-gallery.js','favicon.svg','display.ttf','FONT-LICENSE.txt','googledd29f73153431fc9.html', ...[1,2,3,4].map(n => `enhanced-${n}.webp`)];
for (const asset of assets) {
  const contents = await readFile(join(root, asset));
  if (asset.endsWith('.css')) await writeFile(join(out, asset), contents.toString().replaceAll('../assets/display.ttf', 'display.ttf'));
  else await copyFile(join(root, asset), join(out, asset));
}
const business = {
  '@context':'https://schema.org', '@type':'AutoRepair', name:'Clifford', url:origin+'/', telephone:'+380503381128',
  description:'СТО та шиномонтаж у Чернівцях. Діагностика, технічне обслуговування та послуги автоелектрика.',
  address:{'@type':'PostalAddress',streetAddress:'Головна вулиця, 177',addressLocality:'Чернівці',addressCountry:'UA'},
  image:origin+'/enhanced-4.webp', hasMap:'https://www.google.com/maps?cid=9607613899348475341',
  areaServed:'Чернівці'
};
const title = 'Clifford — СТО та шиномонтаж у Чернівцях | Головна, 177';
for (const [target, source] of [['index.html','sign.html'],['blue.html','index.html'],['classic.html','classic.html'],['dark.html','dark.html'],['sign.html','sign.html']]) {
  let html = await readFile(join(root, source), 'utf8');
  html = html.replace(/<meta name="robots"[^>]*>/g, '').replace(/<title>.*?<\/title>/s, `<title>${title}</title>`).replaceAll('../assets/display.ttf', 'display.ttf');
  const metadata = `<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"><meta property="og:locale" content="uk_UA"><meta property="og:image" content="${origin}/enhanced-4.webp"><script type="application/ld+json">${JSON.stringify(business)}</script>`;
  html = html.replace('</head>', metadata+'</head>');
  await writeFile(join(out, target), html);
}
await writeFile(join(out,'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(join(out,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>\n`);
console.log('Static production site built with canonical URLs, sitemap and AutoRepair structured data.');
