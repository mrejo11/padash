import sharp from 'sharp';
import { stat, writeFile } from 'node:fs/promises';

const imageDirectory = 'public/images';
const source = imageDirectory + '/padash-logo-blue-gold.png';
const logo = imageDirectory + '/padash-logo-blue-gold.webp';
const mark = imageDirectory + '/padash-mark-blue-gold.webp';
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const lossless = { lossless: true, effort: 6 };

await sharp(source).webp(lossless).toFile(logo);

// The long tip crosses the top of the wordmark, so crop the tip separately.
const emblem = await sharp({
  create: { width: 860, height: 865, channels: 4, background: transparent },
}).composite([
  { input: await sharp(source).extract({ left: 232, top: 72, width: 860, height: 847 }).png().toBuffer(), left: 0, top: 0 },
  { input: await sharp(source).extract({ left: 607, top: 919, width: 60, height: 18 }).png().toBuffer(), left: 375, top: 847 },
]).png().toBuffer();

function resizedMark(size) {
  const inset = Math.round(size * 0.06);
  return sharp(emblem).resize(size - inset * 2, size - inset * 2, { fit: 'contain', background: transparent })
    .extend({ top: inset, bottom: inset, left: inset, right: inset, background: transparent });
}

await resizedMark(256).webp(lossless).toFile(mark);

async function iconPng(size) {
  const padded = await resizedMark(size).png().toBuffer();
  return sharp(padded).flatten({ background: '#ffffff' }).png({ compressionLevel: 9 }).toBuffer();
}

for (const [name, size] of [['padash-icon', 96], ['padash-apple', 180]]) {
  await writeFile(`${imageDirectory}/${name}.png`, await iconPng(size));
}
await sharp(source).resize(512, 512).flatten({ background: '#f7faff' }).png({ compressionLevel: 9 })
  .toFile(imageDirectory + '/padash-share.png');

// The legacy favicon URL serves the same raster mark in an SVG container.
const legacyIcon = await iconPng(48);
await writeFile('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><image width="48" height="48" href="data:image/png;base64,${legacyIcon.toString('base64')}"/></svg>\n`);

for (const background of ['#ffffff', '#092a55']) {
  const visiblePixels = path => sharp(path).flatten({ background }).raw().toBuffer();
  if (!(await visiblePixels(source)).equals(await visiblePixels(logo))) {
    throw new Error('Lossless logo differs from the approved artwork');
  }
}
for (const path of [source, logo, mark, ...['padash-icon.png', 'padash-apple.png', 'padash-share.png'].map(name => imageDirectory + '/' + name)]) {
  console.log(path + ': ' + (await stat(path)).size + ' bytes');
}
