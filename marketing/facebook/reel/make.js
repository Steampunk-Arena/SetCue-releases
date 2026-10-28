// Builds the SetCue quote-card Reel (1080×1920, ~26 s): five quotes over visualizer scenes that react to the song,
// then an end card. Visuals are SetCue's own NeonVisualizer, fed the same 64 bands the app computes.
// Usage: node marketing/facebook/reel/make.js <path to SetCue app repo> <song.mp3>
// Needs ffmpeg, Playwright and the Inter / JetBrains Mono fonts.
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { PHOTO, PHOTO_W, PHOTO_H, MONITOR, logo, page } = require('../../instagram/render.js');

const [APP, SONG] = process.argv.slice(2);
const W = 1080, H = 1920, FPS = 30;
const START = 45.5;                    // song position of the first frame (the "Joke's on You" chorus)
const BEAT = 60 / 105;                 // scene lengths are whole bars at the song's 105 BPM
const SCENES = [
  { id: 'founder', beats: 8, bg: 'desk', quote: 'I built a music mixer for myself because I couldn\'t afford the subscription fees.', who: 'Steve D., Founder', size: 82 },
  { id: 'llama', beats: 8, style: 'car-grid', palette: 'ultraviolet', quote: 'It really kicks the llama\'s ass.', who: 'Old music hound' },
  { id: 'mood', beats: 8, style: 'neon-gateway', palette: 'sunset', quote: 'I love ambient mood lighting.', who: 'Gamer' },
  { id: 'monitor', beats: 8, style: 'plasma-helix', palette: 'neon', quote: 'My second monitor finally has a job.', who: 'Desk setup guy' },
  { id: 'sizzle', beats: 8, style: 'hyperspace', palette: 'gold-silver', quote: 'Your space could use more <em>sizzle.</em>', size: 112 },
  { id: 'end', beats: 8, style: 'neon-gateway', palette: 'ultraviolet', end: true },
];
const WORK = path.join(__dirname, 'work');
const OUT = path.join(__dirname, '..', 'out', 'setcue-quotes-reel.mp4');
fs.mkdirSync(WORK, { recursive: true });
const total = SCENES.reduce((t, s) => t + s.beats * BEAT, 0);
const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// ---- Text overlays (transparent PNGs) ----
function overlay(s) {
  const body = s.end ? `
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,0.5), rgba(11,5,18,0.85))"></div>
    <div style="position:absolute;left:80px;right:80px;top:560px;text-align:center">
      <div style="display:flex;justify-content:center;transform:scale(1.6);transform-origin:center top">${logo(56)}</div>
      <h1 style="font-size:96px;margin-top:150px">Your music.<br>Your vibes.<br><em>Let's go.</em></h1>
      <div class="pill" style="font-size:40px;padding:26px 46px;margin-top:70px">Free 14-day demo</div>
      <div class="mono" style="font-size:38px;color:var(--cyan);letter-spacing:0.06em;margin-top:44px">getsetcue.com</div>
      <div style="font-size:32px;color:var(--muted);margin-top:24px">15% off for early customers · code <b style="color:var(--text)">15OFF</b></div>
    </div>` : `
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,0.0) 40%, rgba(11,5,18,0.82) 70%, rgba(11,5,18,0.95) 100%)"></div>
    <div style="position:absolute;left:80px;right:80px;bottom:300px">
      ${s.who ? '<div style="font-size:170px;line-height:0.6;font-weight:800;color:var(--pink);height:72px">“</div>' : ''}
      <h1 style="font-size:${s.size || 100}px;line-height:1.04">${s.quote}</h1>
      ${s.who ? `<div class="mono" style="font-size:32px;color:var(--cyan);letter-spacing:0.08em;margin-top:34px">— ${s.who}</div>` : ''}
    </div>
    <div style="position:absolute;left:80px;right:80px;bottom:110px;display:flex;justify-content:space-between;align-items:center">
      ${logo(40)}<div class="mono" style="font-size:28px;color:var(--muted)">getsetcue.com</div>
    </div>`;
  return page(W, H, body).replace('class="canvas" style="width', 'class="canvas" style="background:transparent;width')
    .replace('</head>', '<style>body{background:transparent}</style></head>');
}

// ---- Serve the app's renderer files and the song to a headless page ----
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((q, r) => {
      const u = decodeURI(q.url.split('?')[0]);
      if (u === '/') { r.setHeader('content-type', 'text/html'); return r.end('<!doctype html><body style="margin:0;background:#000"><canvas id=c style="width:1080px;height:1920px;display:block"></canvas>'); }
      const f = u === '/song.wav' ? path.join(WORK, 'song.wav') : path.join(APP, u);
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.mjs') ? 'text/javascript' : 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => resolve(srv));
  });
}

(async () => {
  // The song section, with a second of lead-in so the visuals have history at the first frame.
  ff('-ss', String(START - 2), '-t', String(total + 3), '-i', SONG, '-ac', '2', '-ar', '44100', path.join(WORK, 'song.wav'));
  const srv = await serve();
  const base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  tab.on('pageerror', e => console.log('page error:', e.message));
  await tab.goto(base + '/');

  // Bands exactly as the app computes them (analyser fftSize 8192, smoothing .65, 64 log bands 30 Hz–16 kHz),
  // read offline at every video frame.
  const frames = Math.round(total * FPS), lead = 2 * FPS;
  const spectrum = await tab.evaluate(async ({ frames, lead, FPS }) => {
    const data = await (await fetch('/song.wav')).arrayBuffer();
    const probe = new OfflineAudioContext(2, 44100, 44100), buffer = await probe.decodeAudioData(data);
    const ctx = new OfflineAudioContext(2, buffer.length, 44100), src = ctx.createBufferSource(), an = ctx.createAnalyser();
    an.fftSize = 8192; an.smoothingTimeConstant = .65; src.buffer = buffer; src.connect(an); an.connect(ctx.destination);
    const out = [], freq = new Uint8Array(an.frequencyBinCount), time = new Uint8Array(an.fftSize), binHz = 44100 / an.fftSize;
    for (let f = 1; f <= frames + lead; f++) ctx.suspend(f / FPS).then(() => {
      an.getByteFrequencyData(freq); an.getByteTimeDomainData(time);
      const bands = [], wave = [];
      for (let i = 0; i < 64; i++) {
        const a = Math.min(freq.length - 1, Math.floor(30 * Math.pow(16000 / 30, i / 64) / binHz)), b = Math.min(freq.length, Math.max(a + 1, Math.ceil(30 * Math.pow(16000 / 30, (i + 1) / 64) / binHz)));
        let sum = 0; for (let j = a; j < b; j++) sum += freq[j]; bands.push(Math.round(sum / (b - a)));
      }
      for (let i = 0; i < 128; i++) wave.push(time[Math.floor(i * time.length / 128)]);
      out.push({ bands, wave }); ctx.resume();
    });
    src.start(); await ctx.startRendering(); return out;
  }, { frames, lead, FPS });
  console.log('analysed', spectrum.length, 'frames');

  // Render each scene: visualizer frames (warmed up on the frames before the scene) or the desk photo, plus its overlay.
  await tab.evaluate(() => import('/src/renderer/visualizer.mjs').then(m => { window.NV = m.NeonVisualizer; }));
  let at = 0;
  const parts = [];
  for (const s of SCENES) {
    const n = Math.round(s.beats * BEAT * FPS), dir = path.join(WORK, s.id);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const ov = path.join(WORK, s.id + '-overlay.png');
    await tab.setContent(overlay(s), { waitUntil: 'load' }); await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: ov, omitBackground: true });
    const clip = path.join(WORK, s.id + '.mp4');
    if (s.bg === 'desk') {
      // Slow push-in on the desk photo, cropped to portrait around the monitor.
      const sc = H / PHOTO_H, cx = (MONITOR.x + MONITOR.w / 2) * sc;
      ff('-loop', '1', '-i', path.join(__dirname, '..', '..', 'instagram', 'source', 'desk-setup.png'), '-i', ov, '-filter_complex',
        `[0]scale=-2:${H * 2},crop=${W * 2}:${H * 2}:${Math.round(cx * 2 - W)}:0,zoompan=z='1+0.0009*on':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}[v];` +
        `[1]format=rgba,fade=in:st=0.25:d=0.5:alpha=1[o];[v][o]overlay=shortest=0[out]`, '-map', '[out]', '-t', String(n / FPS), '-r', String(FPS), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '18', clip);
    } else {
      await tab.goto(base + '/');
      await tab.evaluate(() => import('/src/renderer/visualizer.mjs').then(m => { window.v = new m.NeonVisualizer(document.getElementById('c')); window.t = 1000; }));
      const settings = { style: s.style, palette: s.palette, glow: 24 };
      const step = (i) => tab.evaluate(([fr, settings]) => { window.t += 1000 / 30; window.v.draw({ mode: 'local', ...fr, settings }, window.t); }, [spectrum[i], settings]);
      for (let i = Math.max(0, lead + at - 90); i < lead + at; i++) await step(i);
      for (let i = 0; i < n; i++) {
        await step(lead + at + i);
        await tab.locator('#c').screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
      }
      ff('-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'), '-i', ov, '-filter_complex',
        `[1]format=rgba,fade=in:st=0.25:d=0.5:alpha=1[o];[0][o]overlay[out]`, '-map', '[out]', '-r', String(FPS), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-crf', '18', clip);
    }
    parts.push(clip); at += n; console.log('scene', s.id, n, 'frames');
  }
  await browser.close(); srv.close();

  // Hard cuts on the bar, the song underneath, fading out over the end card.
  fs.writeFileSync(path.join(WORK, 'parts.txt'), parts.map(p => `file '${p}'`).join('\n'));
  ff('-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'parts.txt'), '-ss', '2', '-i', path.join(WORK, 'song.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-af', `afade=in:d=0.3,afade=out:st=${(total - 2.5).toFixed(2)}:d=2.5`,
    '-t', total.toFixed(2), '-movflags', '+faststart', OUT);
  console.log('wrote', OUT);
})();
