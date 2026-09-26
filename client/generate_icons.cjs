const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const input = 'public/icon.png';
  const outDir = 'public/icons';
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Standard non-maskable icons (flatten with white bg)
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(input)
      .resize(size, size, { fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .toFile(`${outDir}/icon-${size}x${size}.png`);
  }

  // Apple touch icon (180x180, solid bg)
  await sharp(input)
    .resize(180, 180, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .toFile(`${outDir}/apple-touch-icon.png`);

  // Favicons
  await sharp(input)
    .resize(32, 32, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .toFile(`public/favicon-32x32.png`); // Output to public root for favicon
    
  await sharp(input)
    .resize(16, 16, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .toFile(`public/favicon-16x16.png`);

  // Maskable icons (80% safe zone) -> 80% inner size
  const maskableSizes = [
    { size: 192, inner: 154 },
    { size: 512, inner: 410 }
  ];

  for (const {size, inner} of maskableSizes) {
    await sharp(input)
      .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: Math.floor((size - inner) / 2),
        bottom: Math.ceil((size - inner) / 2),
        left: Math.floor((size - inner) / 2),
        right: Math.ceil((size - inner) / 2),
        background: '#ffffff'
      })
      .flatten({ background: '#ffffff' })
      .toFile(`${outDir}/icon-maskable-${size}x${size}.png`);
  }

  console.log('Icons generated successfully.');
}

generateIcons().catch(console.error);
