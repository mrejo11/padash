import sharp from 'sharp';
import { stat } from 'node:fs/promises';

// The owner's supplied warm wordmark is the source, not an AI reconstruction.
// Keep legacy artwork; the new main URL avoids stale optimized-image caches.
const source = 'public/images/padash-logo-warm.png';
const logo = 'public/images/padash-logo-warm.webp';
await sharp(source).webp({lossless: true, effort: 6}).toFile(logo);
for (const [name, size] of [['padash-icon', 96], ['padash-apple', 180], ['padash-share', 512]]) {
  await sharp(source).resize(size, size, {fit: 'contain', background: '#ffffff'})
    .png({compressionLevel: 9}).toFile(`public/images/${name}.png`);
}
const visiblePixels = path => sharp(path).flatten({background: '#ffffff'}).raw().toBuffer();
if (!(await visiblePixels(source)).equals(await visiblePixels(logo))) {
  throw new Error('Lossless logo differs from the approved artwork');
}
for (const name of ['padash-logo-warm.png', 'padash-logo-warm.webp', 'padash-icon.png', 'padash-apple.png', 'padash-share.png']) {
  console.log(name + ': ' + (await stat('public/images/' + name)).size + ' bytes');
}
