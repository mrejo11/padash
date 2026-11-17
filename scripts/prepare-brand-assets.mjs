import sharp from 'sharp';
import { stat } from 'node:fs/promises';

// Derive small public assets from the existing approved artwork; keep the source.
const source = 'public/images/padash-logo-slim.png';
await sharp(source).webp({lossless: true, effort: 6}).toFile('public/images/padash-logo.webp');
for (const [name, size] of [['padash-icon', 96], ['padash-apple', 180], ['padash-share', 512]]) {
  await sharp(source).resize(size, size, {fit: 'contain', background: '#ffffff'})
    .png({compressionLevel: 9}).toFile(`public/images/${name}.png`);
}
const visiblePixels = path => sharp(path).flatten({background: '#ffffff'}).raw().toBuffer();
if (!(await visiblePixels(source)).equals(await visiblePixels('public/images/padash-logo.webp'))) {
  throw new Error('Lossless logo differs from the approved artwork');
}
for (const name of ['padash-logo-slim.png', 'padash-logo.webp', 'padash-icon.png', 'padash-apple.png', 'padash-share.png']) {
  console.log(name + ': ' + (await stat('public/images/' + name)).size + ' bytes');
}
