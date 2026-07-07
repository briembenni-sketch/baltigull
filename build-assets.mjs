// BaltiGull — asset pipeline. Originals in "Asynd (1)" stay untouched; web copies -> assets/
// Usage: node build-assets.mjs [images|videos|all]
import sharp from 'sharp';
import { execFileSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { mkdirSync, statSync } from 'fs';
import path from 'path';

const SRC = 'Asynd (1)';
const OUT = 'assets';
mkdirSync(OUT, { recursive: true });
const mode = process.argv[2] || 'all';
const s = (f) => path.join(SRC, f);
const o = (f) => path.join(OUT, f);
const mb = (p) => (statSync(p).size / 1048576).toFixed(2) + 'MB';

// Square cover (source already square) — straight resize.
async function squareFlat(src, out, size, q = 82) {
  await sharp(s(src)).resize(size, size, { fit: 'cover' }).webp({ quality: q }).toFile(o(out));
  console.log('  ✓', out, mb(o(out)));
}
// Square cover from non-square source — salient-region crop.
async function squareCrop(src, out, size, q = 82) {
  await sharp(s(src)).resize(size, size, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: q }).toFile(o(out));
  console.log('  ✓', out, mb(o(out)));
}
// Cinematic still — trim black letterbox bars, then fit inside longEdge.
async function photo(src, out, longEdge = 1600, q = 80) {
  const m0 = await sharp(s(src)).metadata();
  let pipe;
  try {
    pipe = sharp(s(src)).trim({ background: '#000000', threshold: 8 });
    await pipe.clone().metadata(); // force trim eval; throws if degenerate
  } catch {
    pipe = sharp(s(src));
  }
  await pipe.resize(longEdge, longEdge, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: q }).toFile(o(out));
  const m1 = await sharp(o(out)).metadata();
  console.log('  ✓', out, `${m0.width}x${m0.height}→${m1.width}x${m1.height}`, mb(o(out)));
}
// Manual crop (for the screenshot with app UI).
async function cropPhoto(src, out, region, longEdge = 1600, q = 80) {
  await sharp(s(src)).extract(region)
    .trim({ background: '#000000', threshold: 12 })
    .resize(longEdge, longEdge, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: q }).toFile(o(out));
  const m1 = await sharp(o(out)).metadata();
  console.log('  ✓', out, `${m1.width}x${m1.height}`, mb(o(out)));
}

async function images() {
  console.log('Images:');
  // Covers
  await squareFlat('Hvaðer ast cover.png', 'cover-hvad-er-ast.webp', 1400);
  await squareFlat('Farið til þín Cover.png', 'cover-farid-til-thin.webp', 1400);
  await squareFlat('HK COVER', 'cover-hk.webp', 1200);
  await squareCrop('Engill Cover', 'cover-engill.webp', 1400); // 6192x4128 landscape → square
  await squareFlat('HVAÐ ER AST TRACKLIST.png', 'tracklist-hvad-er-ast.webp', 1400);
  // Portrait for the Warhol grid — trim letterbox first, then portrait crop on the face
  await sharp(s('Photo 20.5.2026, 01 14 51.png'))
    .trim({ background: '#000000', threshold: 8 })
    .resize(1080, 1440, { fit: 'cover', position: 'centre' })
    .webp({ quality: 84 }).toFile(o('portrait.webp'));
  console.log('  ✓ portrait.webp', mb(o('portrait.webp')));
  // Cinematic stills (letterbox trimmed)
  await photo('Photo 20.5.2026, 01 14 51.png', 'photo-elevator.webp');
  await photo('Photo 20.5.2026, 01 16 50.png', 'photo-silhouette.webp');
  await photo('Photo 21.4.2026, 10 53 39.png', 'photo-eye.webp');
  await photo('Photo 24.4.2026, 11 32 26.png', 'photo-motion.webp');
  await photo('Strippari mynd.png', 'photo-car.webp');
  // Landscape screenshot — manual crop to the 16:9 video band (verify visually)
  await cropPhoto('Photo 27.4.2026, 21 40 49.png', 'photo-landscape.webp',
    { left: 0, top: 788, width: 1206, height: 678 });
}

function run(label, args) {
  try {
    execFileSync(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'ignore'] });
    console.log('  ✓', label, mb(args[args.length - 1]));
  } catch (e) {
    console.log('  ✗', label, 'FAILED:', (e.message || '').split('\n')[0]);
  }
}

const TRAILER = s('baltitrailer4.mp4');
const LOFORD = s('L O F O R Ð MusicvideoFinal.mp4');

// Hero ambient loop — cinematic segment from the Loförð music video (NOT the vlog-style
// trailer). 12s, 1280w, muted (autoplay-safe). mp4 + webm.
function heroLoop() {
  console.log('Hero loop (from Loförð):');
  run('hero-loop.mp4', ['-y', '-ss', '25', '-t', '12', '-i', LOFORD, '-an', '-vf', 'scale=1280:-2',
    '-r', '30', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '24',
    '-preset', 'slow', '-movflags', '+faststart', o('hero-loop.mp4')]);
  run('hero-loop.webm', ['-y', '-ss', '25', '-t', '12', '-i', LOFORD, '-an', '-vf', 'scale=1280:-2',
    '-r', '30', '-c:v', 'libvpx-vp9', '-crf', '33', '-b:v', '0', '-row-mt', '1', o('hero-loop.webm')]);
  run('hero-poster.jpg', ['-y', '-ss', '31', '-i', LOFORD, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', o('hero-poster.jpg')]);
}

function sectionVideos() {
  console.log('Section videos:');
  // Loförð music video — full, 720p, WITH audio, click-to-play.
  run('loford.mp4', ['-y', '-i', LOFORD, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-crf', '28', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', o('loford.mp4')]);
  run('loford-poster.jpg', ['-y', '-ss', '30', '-i', LOFORD, '-frames:v', '1', '-vf', 'scale=-2:720', '-q:v', '3', o('loford-poster.jpg')]);
  // Trailer (vlog-style intro) — 40s cut, 720p, WITH audio.
  run('trailer.mp4', ['-y', '-ss', '4', '-t', '40', '-i', TRAILER, '-vf', 'scale=-2:720', '-c:v', 'libx264',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'fast', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', o('trailer.mp4')]);
  run('trailer-poster.jpg', ['-y', '-ss', '14', '-i', TRAILER, '-frames:v', '1', '-vf', 'scale=-2:720', '-q:v', '3', o('trailer-poster.jpg')]);
}

function videos() { console.log('Videos:'); heroLoop(); sectionVideos(); }

if (mode === 'images' || mode === 'all') await images();
if (mode === 'hero') heroLoop();
if (mode === 'videos' || mode === 'all') videos();
console.log('Done:', mode);
