// Builds the Halloween "you're a nightclub now" ad (1080×1920, ~24 s) from footage of a party SetCue ran,
// cut on the beat of a demo-pack song.
// Usage: node marketing/ads/build-halloween.js <song.mp3>
// Expects in source/ (kept out of git): legion-walkthrough.mp4 (empty hall → dance floor → screen → laptop, 9 s),
// legion-dancers.mp4 (dance floor, 22 s) and legion-wide.mp4 (wide shot with disco lights, 12 s).
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { logo, page } = require('../instagram/render.js');

const SONG = process.argv[2];
const W = 1080, H = 1920, FPS = 30;
const BEAT = 60 / 105;                 // "Joke's on You" runs at 105 BPM
const SONG_START = 45.5;               // the chorus
const SRC = path.join(__dirname, 'source');
const WORK = path.join(__dirname, 'work', 'halloween');
const OUT = path.join(__dirname, 'out', 'setcue-halloween-ad.mp4');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const ORANGE = '#ff8a1f';
const fill = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;

// A clip: `from`–`to` seconds of a source, stretched or squeezed to the scene length. `freeze` holds one frame.
// `wide` puts a landscape clip over a blurred copy of itself.
const clip = (file, from, to, { dim = 0, freeze = false, wide = false } = {}) => ({ file, from, to, dim, freeze, wide });

const SCENES = [
  { beats: 4, text: 'Halloween party <em>tonight?</em>', size: 120, clip: clip('legion-walkthrough.mp4', 0, 1.1, { dim: -0.15 }) },
  { beats: 4, text: 'Current vibe:<br><em>waiting room.</em>', size: 120, clip: clip('legion-walkthrough.mp4', 0.4, 0.4, { freeze: true, dim: -0.1 }) },
  { beats: 4, text: 'Step 1:<br><em>open laptop.</em>', size: 120, clip: clip('legion-walkthrough.mp4', 8.0, 9.3) },
  { beats: 4, text: 'Step 2:<br><em>press play.</em>', size: 120, clip: clip('legion-walkthrough.mp4', 4.9, 6.6) },
  { beats: 6, text: 'Congratulations.<br><em>You\'re a nightclub now.</em>', size: 100, clip: clip('legion-walkthrough.mp4', 1.6, 4.9) },
  { beats: 8, text: 'Costumes: optional.<br><em>Dancing: mandatory.</em>', size: 88, clip: clip('legion-dancers.mp4', 3, 12) },
  { beats: 5, text: 'Setup time: less than<br><em>finding a costume.</em>', size: 92, clip: clip('legion-dancers.mp4', 16, 19.5) },
  { beats: 7, end: true, clip: clip('legion-wide.mp4', 2, 6, { wide: true, dim: -0.1 }) },
];

function overlay(s) {
  const shadow = 'text-shadow:0 4px 30px rgba(0,0,0,0.8),0 0 2px rgba(0,0,0,0.7)';
  const body = s.end ? `
    <div style="position:absolute;inset:0;background:rgba(11,5,18,0.72)"></div>
    <div style="position:absolute;left:90px;right:90px;top:380px;text-align:center">
      <div style="display:flex;justify-content:center;transform:scale(1.5);transform-origin:center top">${logo(56)}</div>
      <div class="mono" style="font-size:34px;color:var(--muted);letter-spacing:0.14em;margin-top:120px">DESKTOP DJ · LIGHTS · VISUALS</div>
      <h1 style="font-size:96px;margin-top:40px;${shadow}">Free for 14 days.</h1>
      <div style="font-size:44px;color:var(--text);margin-top:24px;${shadow}">Your party is tonight.<br>You're covered. 🎃</div>
      <div class="pill" style="display:flex;justify-content:center;width:fit-content;margin:64px auto 0;font-size:44px;padding:26px 50px">getsetcue.com</div>
      <div style="font-size:34px;color:var(--muted);margin-top:34px">Buying? 15% off with code <b style="color:${ORANGE}">15OFF</b></div>
    </div>` : `
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,0.55) 0%, rgba(11,5,18,0) 38%)"></div>
    <div style="position:absolute;left:90px;right:130px;top:${0.2 * H}px;transform:translateY(-50%)">
      <h1 style="font-size:${s.size}px;line-height:1.05;${shadow}">${s.text}</h1>
    </div>`;
  return page(W, H, body)
    .replace('class="canvas" style="width', 'class="canvas" style="background:transparent;width')
    .replace('</head>', `<style>body{background:transparent} h1 em{color:${ORANGE}}</style></head>`);
}

const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

(async () => {
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  const parts = [];
  let total = 0;
  for (const [i, s] of SCENES.entries()) {
    const dur = s.beats * BEAT, c = s.clip, ov = path.join(WORK, `scene-${i}.png`), out = path.join(WORK, `scene-${i}.mp4`);
    await tab.setContent(overlay(s), { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: ov, omitBackground: true });
    // Stretch or squeeze the source span to the scene; a frozen frame gets a slow push-in instead.
    const span = c.to - c.from, speed = c.freeze ? 1 : span / dur;
    const timing = c.freeze ? `trim=end_frame=1,loop=loop=-1:size=1,setpts=N/${FPS}/TB,zoompan=z='1+0.0008*on':d=1:s=${W}x${H}:fps=${FPS},` : `setpts=PTS/${speed.toFixed(4)},`;
    const frame = c.wide
      ? `split[a][b];[a]${fill},boxblur=24:2,eq=brightness=-0.3[back];[b]scale=${W}:-2,eq=brightness=${c.dim}[front];[back][front]overlay=0:(H-h)/2[bg0];[bg0]`
      : `${fill},eq=brightness=${c.dim},`;
    ff('-ss', String(c.from), '-t', String(Math.max(span, 0.1) + 0.2), '-i', path.join(SRC, c.file), '-loop', '1', '-framerate', String(FPS), '-i', ov,
      '-filter_complex', `[0:v]${c.freeze ? `${fill},eq=brightness=${c.dim},${timing}` : `${frame}${timing}`}fps=${FPS},setsar=1[bg];` +
      `[1:v]format=rgba,fade=in:st=0:d=0.15:alpha=1[t];[bg][t]overlay=shortest=1,format=yuv420p[out]`,
      '-map', '[out]', '-t', dur.toFixed(3), '-c:v', 'libx264', '-crf', '18', '-an', out);
    parts.push(out);
    total += dur;
    console.log('scene', i, dur.toFixed(2), 's');
  }
  await browser.close();

  fs.writeFileSync(path.join(WORK, 'parts.txt'), parts.map(p => `file '${p}'`).join('\n'));
  ff('-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'parts.txt'), '-ss', String(SONG_START), '-i', SONG,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-af', `afade=in:d=0.2,afade=out:st=${(total - 1.5).toFixed(2)}:d=1.5`, '-t', total.toFixed(2), '-movflags', '+faststart', OUT);
  console.log('wrote', OUT, total.toFixed(1), 's');
})();
