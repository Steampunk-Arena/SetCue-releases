// Builds the 30-second "Hey you…" ad for TikTok and Meta (1080×1920) from the two light-demo videos,
// SetCue screenshots and a demo-pack song. Scene lengths are whole beats of the song, so cuts land on the beat.
// Usage: node marketing/ads/build-ad.js <song.mp3>
// Expects source/light-demo-1.mp4 (vertical desk clip) and source/light-demo-2.mp4 (wide living-room clip);
// they are kept out of git. Needs ffmpeg, Playwright and the Inter / JetBrains Mono fonts.
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { logo, page } = require('../instagram/render.js');

const SONG = process.argv[2];
const W = 1080, H = 1920, FPS = 30;
const BEAT = 60 / 90;                  // "Iron & Sweat" runs at 90 BPM
const SONG_START = 50.88;              // 12 beats before the chorus, so it lands on "That's cool, we do too"
const SRC = path.join(__dirname, 'source');
const DESK = path.join(SRC, 'light-demo-1.mp4');     // 560×1312, 24 s
const ROOM = path.join(SRC, 'light-demo-2.mp4');     // 1280×560, 38 s
const SHOTS = path.join(__dirname, '..', 'facebook', 'source');
const WORK = path.join(__dirname, 'work');
const OUT = path.join(__dirname, 'out', 'setcue-hey-you-ad.mp4');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Background recipes. Each returns ffmpeg inputs and a filter that ends in [bg] at W×H.
const fill = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
const blurred = (dim) => `${fill},boxblur=24:2,eq=brightness=${dim}`;
const bg = {
  // The desk clip filling the frame, optionally darkened, blurred or zoomed in on the lights.
  desk: ({ at, dim = 0, blur = false, zoom = 0 }) => ({
    inputs: ['-ss', String(at), '-i', DESK],
    filter: `[0:v]${zoom ? `crop=iw:iw*16/9:0:ih-iw*16/9-${zoom},` : ''}${blur ? blurred(dim) : `${fill},eq=brightness=${dim}`},setsar=1[bg]`,
  }),
  // The living-room clip: a 9:8 crop around the TV over a blurred copy of itself.
  room: ({ at, dim = 0 }) => ({
    inputs: ['-ss', String(at), '-i', ROOM],
    filter: `[0:v]split[a][b];[a]${blurred(-0.3)}[back];[b]crop=630:560:330:0,scale=${W}:-2,eq=brightness=${dim}[front];` +
      `[back][front]overlay=0:(H-h)/2+120,setsar=1[bg]`,
  }),
  // A SetCue screenshot as a card over the blurred desk clip.
  card: ({ at, image, crop, width = 960, top = 760 }) => ({
    inputs: ['-ss', String(at), '-i', DESK, '-loop', '1', '-i', path.join(SHOTS, image)],
    filter: `[0:v]${blurred(-0.35)}[back];[1:v]crop=${crop},scale=${width}:-2[shot];[back][shot]overlay=(W-w)/2:${top},setsar=1[bg]`,
  }),
};

// The script. `y` is where the text block is centred (0–1 of the height).
const SCENES = [
  { beats: 3, text: 'Hey you…', size: 150, y: 0.45, bg: bg.desk({ at: 0, dim: -0.55, blur: true }) },
  { beats: 3, text: 'Yes, <em>you</em> there.', size: 130, y: 0.45, bg: bg.desk({ at: 1.8, dim: -0.5, blur: true }) },
  { beats: 6, text: 'The algorithm tells us that you\'re a person who likes <em>music and lighting.</em>', size: 84, y: 0.36, bg: bg.desk({ at: 3.5, dim: -0.12 }) },
  { beats: 3, text: 'That\'s cool,<br><em>we do too.</em>', size: 120, y: 0.3, bg: bg.desk({ at: 17.3 }) },
  { beats: 5, text: 'Download our<br><em>Desktop DJ</em>', size: 120, y: 0.24,
    bg: bg.card({ at: 8, image: 'lyrics.jpg', crop: '1700:2000:0:0', width: 1000, top: 700 }) },
  { beats: 5, text: '…then look up<br><em>DMX 512 lighting…</em>', size: 100, y: 0.24, bg: bg.desk({ at: 6, dim: -0.05, zoom: 40 }) },
  { beats: 5, text: '…then do a search for <em>MIDI controllers.</em>', size: 88, y: 0.2,
    bg: bg.card({ at: 12, image: 'midi.jpg', crop: '1150:1500:0:0', width: 1000, top: 640 }) },
  { beats: 5, text: 'Wait, these lights sync up <em>to videos?</em>', size: 92, y: 0.2, bg: bg.room({ at: 10 }) },
  { beats: 4, text: 'Yes, they<br><em>absolutely do.</em>', size: 120, y: 0.2, bg: bg.room({ at: 30 }) },
  { beats: 6, end: true, bg: bg.room({ at: 33, dim: -0.1 }) },
];

function overlay(s) {
  const shadow = 'text-shadow:0 4px 30px rgba(0,0,0,0.75),0 0 2px rgba(0,0,0,0.6)';
  const body = s.end ? `
    <div style="position:absolute;inset:0;background:rgba(11,5,18,0.72)"></div>
    <div style="position:absolute;left:90px;right:90px;top:430px;text-align:center">
      <div style="display:flex;justify-content:center;transform:scale(1.5);transform-origin:center top">${logo(56)}</div>
      <h1 style="font-size:104px;margin-top:140px;${shadow}">Buy now and get<br><em>15% off</em></h1>
      <div style="font-size:40px;color:var(--muted);margin-top:46px">with code</div>
      <div style="display:inline-block;font-size:96px;font-weight:800;color:var(--cyan);letter-spacing:0.06em;
        border:4px dashed var(--cyan);border-radius:22px;padding:10px 40px;margin-top:18px">15OFF</div>
      <div class="pill" style="display:flex;justify-content:center;width:fit-content;margin:70px auto 0;font-size:44px;padding:26px 50px">getsetcue.com</div>
      <div style="font-size:32px;color:var(--muted);margin-top:30px">Free 14-day demo · Windows, Mac &amp; Linux</div>
    </div>` : `
    <div style="position:absolute;left:90px;right:130px;top:${s.y * H}px;transform:translateY(-50%)">
      <h1 style="font-size:${s.size}px;line-height:1.05;${shadow}">${s.text}</h1>
    </div>`;
  return page(W, H, body)
    .replace('class="canvas" style="width', 'class="canvas" style="background:transparent;width')
    .replace('</head>', '<style>body{background:transparent}</style></head>');
}

const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

(async () => {
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  const parts = [];
  let total = 0;
  for (const [i, s] of SCENES.entries()) {
    const dur = s.beats * BEAT, ov = path.join(WORK, `scene-${i}.png`), clip = path.join(WORK, `scene-${i}.mp4`);
    await tab.setContent(overlay(s), { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: ov, omitBackground: true });
    const n = s.bg.inputs.filter(a => a === '-i').length;  // the overlay is the next input
    ff(...s.bg.inputs, '-loop', '1', '-framerate', String(FPS), '-i', ov, '-filter_complex',
      `${s.bg.filter};[${n}:v]format=rgba,fade=in:st=0:d=0.15:alpha=1[t];[bg][t]overlay=shortest=1,fps=${FPS},format=yuv420p[out]`,
      '-map', '[out]', '-t', dur.toFixed(3), '-c:v', 'libx264', '-crf', '18', '-an', clip);
    parts.push(clip);
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
