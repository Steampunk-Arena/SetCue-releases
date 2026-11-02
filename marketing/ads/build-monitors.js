// Builds the "How many monitors is too many monitors? Answer? Yes." Reel (1080×1920) and feed post (1080×1350).
// Screens pop onto a wall on the beat; every extra screen shows the same live SetCue visualizer (as the app's
// pop-out windows do), then on "one giant screen" the visualizer spans the whole wall as one picture, placed by
// each monitor's position like a video wall. The main monitor shows the app with its docked visualizer running.
// Usage: node marketing/ads/build-monitors.js <SetCue app repo> <song.mp3> <bpm> <start seconds, on a downbeat>
// e.g.   node marketing/ads/build-monitors.js ../setcue source/break-through-the-wire.mp3 123 249.942
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const { logo, page } = require('../instagram/render.js');

const [APP, SONG, BPM, START] = process.argv.slice(2);
const W = 1080, H = 1920, FPS = 30;
const BEAT = 60 / Number(BPM);
const BEATS = 60;
const SPAN_AT = 36;                    // the beat the wall becomes one spanned picture
const T = b => +(b * BEAT).toFixed(3);
const TOTAL = T(BEATS);
const WORK = path.join(__dirname, 'work', 'monitors');
const OUT = path.join(__dirname, 'out');
const APP_SHOT = path.join(__dirname, '..', 'facebook', 'source', 'lyrics.jpg');   // 3200×2000 SetCue screenshot
fs.mkdirSync(WORK, { recursive: true });
const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// The visualizer cycles through released patterns every two bars, on every screen at once.
const LOOKS = [['neon-gateway', 'sunset'], ['hyperspace', 'midnight-cyan'], ['plasma-helix', 'neon'], ['holo-terrain', 'ice'],
  ['car-grid', 'ultraviolet'], ['laser-grid', 'neon'], ['solar-flare', 'fire']];

// Screens [x, y, w, h] and the beat each one appears on. The first is the main monitor with the app.
const SCREENS = [
  { r: [250, 900, 580, 326], at: 0, main: true },
  { r: [300, 600, 480, 270], at: 8 },
  { r: [40, 760, 190, 338], at: 10, portrait: true },
  { r: [850, 760, 200, 113], at: 12 },
  { r: [850, 900, 200, 113], at: 14 },
  { r: [390, 1252, 300, 169], at: 16 },
  { r: [40, 566, 230, 129], at: 18 },
  { r: [810, 566, 230, 129], at: 20 },
  { r: [850, 1030, 190, 338], at: 22, portrait: true },
  { r: [120, 1318, 150, 85], at: 24, tablet: true },
];
// The spanned picture covers every screen but the main one, positioned by where each screen sits.
const SPAN = (() => {
  const r = SCREENS.filter(s => !s.main).map(s => s.r);
  const x = Math.min(...r.map(a => a[0])), y = Math.min(...r.map(a => a[1]));
  const w = Math.max(...r.map(a => a[0] + a[2])) - x, h = Math.max(...r.map(a => a[1] + a[3])) - y;
  return { x, y, w: w + (w % 2), h: h + (h % 2) };
})();

// ---- Static layers (transparent PNGs unless noted) ----
const transparent = html => page(W, H, html)
  .replace('class="canvas" style="width', 'class="canvas" style="background:transparent;width')
  .replace('</head>', '<style>body{background:transparent}</style></head>');

const room = () => page(W, H, `
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 90% 45% at 50% 48%, #3a1a8a 0%, #1b0b4a 45%, #0b0512 85%)"></div>
  <div style="position:absolute;left:0;right:0;top:1395px;height:30px;background:linear-gradient(90deg,#fa56b0,#7b4dff,#57e4ee,#7b4dff,#fa56b0);filter:blur(16px);opacity:.8"></div>
  <div style="position:absolute;left:-20px;right:-20px;top:1420px;height:60px;background:linear-gradient(180deg,#1d1730,#0f0b1a);border-top:2px solid rgba(185,140,255,.35)"></div>
  <div style="position:absolute;left:0;right:0;top:1480px;bottom:0;background:linear-gradient(180deg,#07040d,#0b0512)"></div>
  <div style="position:absolute;left:330px;top:1436px;width:420px;height:26px;border-radius:8px;background:#e9e4f2;box-shadow:0 0 30px rgba(87,228,238,.35)"></div>
  <div style="position:absolute;left:790px;top:1436px;width:46px;height:26px;border-radius:13px;background:#e9e4f2"></div>`);

const monitor = s => {
  const [x, y, w, h] = s.r, b = s.tablet ? 8 : 10;
  const stand = s.tablet ? '' : y + h > 1200
    ? `<div style="position:absolute;left:${x + w / 2 - 30}px;top:${y + h + b}px;width:60px;height:${1422 - y - h - b}px;background:#14111d"></div>`
    : '';
  return transparent(`
    <div style="position:absolute;left:${x - 40}px;top:${y - 40}px;width:${w + 80}px;height:${h + 80}px;border-radius:40px;
      background:radial-gradient(closest-side, rgba(123,77,255,.55), transparent);filter:blur(10px)"></div>
    ${stand}
    <div style="position:absolute;left:${x - b}px;top:${y - b}px;width:${w + 2 * b}px;height:${h + 2 * b}px;border-radius:${s.tablet ? 12 : 8}px;
      background:#0b0910;border:1px solid rgba(255,255,255,.12)"></div>`);
};

const text = (html, top) => transparent(`<div style="position:absolute;left:80px;right:80px;top:${top}px;text-align:center">${html}</div>`);
const shadow = 'text-shadow:0 4px 30px rgba(0,0,0,.8)';
const TEXTS = [
  { from: 0, to: 24, html: text(`<h1 style="font-size:96px;${shadow}">How many monitors is <em>too many</em> monitors?</h1>`, 150) },
  { from: 24, to: 28, html: text(`<h1 style="font-size:150px;${shadow}">Answer?</h1>`, 250) },
  { from: 28, to: SPAN_AT, html: text(`<h1 style="font-size:230px;${shadow}"><em>Yes.</em></h1>`, 170) },
  { from: 30, to: SPAN_AT, html: text(`<div style="font-size:44px;font-weight:700;${shadow}">One app. Every screen.</div>`, 1560) },
  { from: SPAN_AT, to: 48, html: text(`<h1 style="font-size:96px;${shadow}">And now they're <em>one giant screen.</em></h1>`, 150) },
  { from: SPAN_AT + 4, to: 48, html: text(`<div style="font-size:44px;font-weight:700;${shadow}">Span the visualizer across every monitor.</div>`, 1560) },
  { from: 48, to: BEATS, end: true, html: page(W, H, `
    <div style="position:absolute;inset:0;background:rgba(11,5,18,.78)"></div>
    <div style="position:absolute;left:90px;right:90px;top:520px;text-align:center">
      <div style="display:flex;justify-content:center;transform:scale(1.5);transform-origin:center top">${logo(56)}</div>
      <h1 style="font-size:84px;margin-top:140px;${shadow}"><em>Span</em> the visualizer across every screen you own.</h1>
      <div class="pill" style="display:flex;justify-content:center;width:fit-content;margin:70px auto 0;font-size:44px;padding:26px 50px">getsetcue.com</div>
      <div style="font-size:34px;color:var(--muted);margin-top:34px">Free 14-day demo · 15% off with code <b style="color:var(--text)">15OFF</b></div>
    </div>`).replace('class="canvas" style="width', 'class="canvas" style="background:transparent;width').replace('</head>', '<style>body{background:transparent}</style></head>') },
];

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((q, r) => {
      const u = decodeURI(q.url.split('?')[0]);
      if (u === '/') { r.setHeader('content-type', 'text/html'); return r.end('<!doctype html><body style="margin:0;background:#000"><canvas id=c style="display:block"></canvas>'); }
      const f = u === '/song.wav' ? path.join(WORK, 'song.wav') : path.join(APP, u);
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.mjs') ? 'text/javascript' : 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => resolve(srv));
  });
}

(async () => {
  ff('-ss', String(Number(START) - 2), '-t', String(TOTAL + 3), '-i', SONG, '-ac', '2', '-ar', '44100', path.join(WORK, 'song.wav'));
  const srv = await serve(), base = `http://localhost:${srv.address().port}`;
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  tab.on('pageerror', e => console.log('page error:', e.message));
  await tab.goto(base + '/');

  // Spectrum exactly as the app computes it, read offline at every video frame (2 s of lead-in first).
  const frames = Math.round(TOTAL * FPS), lead = 2 * FPS;
  const spectrum = await tab.evaluate(async ({ n, FPS }) => {
    const data = await (await fetch('/song.wav')).arrayBuffer();
    const buffer = await new OfflineAudioContext(2, 44100, 44100).decodeAudioData(data);
    const ctx = new OfflineAudioContext(2, buffer.length, 44100), src = ctx.createBufferSource(), an = ctx.createAnalyser();
    an.fftSize = 8192; an.smoothingTimeConstant = .65; src.buffer = buffer; src.connect(an); an.connect(ctx.destination);
    const out = [], freq = new Uint8Array(an.frequencyBinCount), time = new Uint8Array(an.fftSize), binHz = 44100 / an.fftSize;
    for (let f = 1; f <= n; f++) ctx.suspend(f / FPS).then(() => {
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
  }, { n: frames + lead, FPS });

  // The visualizer in landscape and portrait, both cycling the same looks at the same moments.
  for (const [name, vw, vh] of [['land', 960, 540], ['port', 540, 960], ['span', SPAN.w, SPAN.h]]) {
    const dir = path.join(WORK, name), done = fs.existsSync(dir) && fs.readdirSync(dir).length === frames;
    if (!done) {
      fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
      await tab.goto(base + '/');
      await tab.evaluate(([vw, vh]) => import('/src/renderer/visualizer.mjs').then(m => {
        const c = document.getElementById('c'); c.style.width = vw + 'px'; c.style.height = vh + 'px';
        window.v = new m.NeonVisualizer(c); window.t = 1000;
      }), [vw, vh]);
      const step = (i, look) => tab.evaluate(([fr, look]) => { window.t += 1000 / 30; window.v.draw({ mode: 'local', ...fr, settings: { style: look[0], palette: look[1], glow: 24 } }, window.t); }, [spectrum[i], look]);
      const lookAt = f => LOOKS[Math.min(LOOKS.length - 1, Math.floor(f / FPS / BEAT / 8))];
      for (let i = 0; i < lead; i++) await step(i, LOOKS[0]);
      for (let f = 0; f < frames; f++) {
        await step(lead + f, lookAt(f));
        await tab.locator('#c').screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 });
      }
    }
    ff('-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(WORK, `${name}.mp4`));
    console.log('visualizer', name);
  }
  await browser.close(); srv.close();

  // Static layers.
  const shot = async (html, file) => {
    const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
    await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: file, omitBackground: true }); await b.close();
  };
  await shot(room(), path.join(WORK, 'room.png'));
  for (const [i, s] of SCREENS.entries()) await shot(monitor(s), path.join(WORK, `monitor-${i}.png`));
  for (const [i, t] of TEXTS.entries()) await shot(t.html, path.join(WORK, `text-${i}.png`));

  // Pass 1: room, monitors and screens (no text), so the feed post can reuse a clean frame.
  const inputs = ['-loop', '1', '-framerate', String(FPS), '-i', path.join(WORK, 'room.png'),
    '-i', path.join(WORK, 'land.mp4'), '-i', path.join(WORK, 'port.mp4'), '-loop', '1', '-framerate', String(FPS), '-i', APP_SHOT];
  SCREENS.forEach((s, i) => inputs.push('-loop', '1', '-framerate', String(FPS), '-i', path.join(WORK, `monitor-${i}.png`)));
  inputs.push('-i', path.join(WORK, 'span.mp4'));
  const spans = SCREENS.length - 1, spanIn = 4 + SCREENS.length, spanStart = T(SPAN_AT);
  const lands = SCREENS.filter(s => !s.portrait).length, ports = SCREENS.filter(s => s.portrait).length;
  let g = `[${spanIn}:v]split=${spans}${Array.from({ length: spans }, (_, i) => `[q${i}]`).join('')};[1:v]split=${lands}${Array.from({ length: lands }, (_, i) => `[l${i}]`).join('')};[2:v]split=${ports}${Array.from({ length: ports }, (_, i) => `[p${i}]`).join('')};`;
  // Main monitor: the app screenshot with the live visualizer in its docked visualizer area.
  const [mx, my, mw, mh] = SCREENS[0].r, k = mw / 3200;
  g += `[3:v]crop=3200:1800:0:0,scale=${mw}:${mh}[app];[l0]crop=960:301:0:120,scale=${Math.round(3128 * k)}:${Math.round(974 * k)}[dock];` +
    `[app][dock]overlay=${Math.round(36 * k)}:${Math.round(112 * k)}[mainscreen];`;
  let last = '[0:v]', li = 1, pi = 0, qi = 0;
  SCREENS.forEach((s, i) => {
    const [x, y, w, h] = s.r, start = T(s.at);
    g += `[${4 + i}:v]format=rgba,fade=in:st=${start}:d=0.12:alpha=1[m${i}];${last}[m${i}]overlay=0:0[b${i}];`;
    const src = s.main ? '[mainscreen]' : s.portrait ? `[p${pi++}]` : `[l${li++}]`;
    g += `${src}scale=${w}:${h},format=rgba,fade=in:st=${start}:d=0.12:alpha=1[s${i}];[b${i}][s${i}]overlay=${x}:${y}${s.main ? '' : `:enable='lt(t,${spanStart})'`}[c${i}];`;
    // From the span beat on, each extra screen shows its own slice of the one spanned picture.
    if (!s.main) g += `[q${qi++}]crop=${w}:${h}:${x - SPAN.x}:${y - SPAN.y}[z${i}];[c${i}][z${i}]overlay=${x}:${y}:enable='gte(t,${spanStart})'[d${i}];`;
    last = s.main ? `[c${i}]` : `[d${i}]`;
  });
  g += `${last}format=yuv420p[out]`;
  ff(...inputs, '-filter_complex', g, '-map', '[out]', '-t', String(TOTAL), '-r', String(FPS), '-c:v', 'libx264', '-crf', '17', path.join(WORK, 'clean.mp4'));

  // Pass 2: text on the beat, and the song.
  const tin = [], tg = [];
  let tl = '[0:v]';
  TEXTS.forEach((t, i) => {
    tin.push('-loop', '1', '-framerate', String(FPS), '-i', path.join(WORK, `text-${i}.png`));
    tg.push(`[${i + 1}:v]format=rgba,fade=in:st=${T(t.from)}:d=0.12:alpha=1,fade=out:st=${(T(t.to) - 0.05).toFixed(3)}:d=0.05:alpha=1[t${i}];${tl}[t${i}]overlay=0:0[v${i}]`);
    tl = `[v${i}]`;
  });
  fs.mkdirSync(OUT, { recursive: true });
  ff('-i', path.join(WORK, 'clean.mp4'), ...tin, '-ss', String(START), '-i', SONG, '-filter_complex', tg.join(';') + `;${tl}format=yuv420p[out]`,
    '-map', '[out]', '-map', `${TEXTS.length + 1}:a`, '-c:v', 'libx264', '-crf', '18', '-c:a', 'aac', '-b:a', '192k',
    '-af', `afade=in:d=0.2,afade=out:st=${(TOTAL - 1.5).toFixed(2)}:d=1.5`, '-t', String(TOTAL), '-movflags', '+faststart', path.join(OUT, 'setcue-monitors-ad.mp4'));

  // Feed post: a clean frame with every screen lit, cropped to 4:5, with the joke on top.
  const still = path.join(WORK, 'still.png');
  ff('-ss', String(T(SPAN_AT + 6)), '-i', path.join(WORK, 'clean.mp4'), '-frames:v', '1', still);
  const img = 'data:image/png;base64,' + fs.readFileSync(still).toString('base64');
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.setContent(page(1080, 1350, `
    <div style="position:absolute;inset:0;background:url('${img}') 0 -470px/1080px 1920px no-repeat"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,.92) 0%, rgba(11,5,18,.4) 17%, rgba(11,5,18,0) 24%, rgba(11,5,18,0) 82%, rgba(11,5,18,.9) 100%)"></div>
    <div style="position:absolute;left:70px;right:70px;top:46px;text-align:center">
      <h1 style="font-size:58px;${shadow}">How many monitors is <em>too many</em> monitors?</h1>
    </div>
    <div style="position:absolute;left:70px;right:70px;bottom:120px;text-align:center">
      <h1 style="font-size:96px;${shadow}">Answer? <em>Yes.</em></h1>
      <div style="font-size:34px;font-weight:700;margin-top:14px;${shadow}">Now span them into one giant screen.</div>
    </div>
    <div style="position:absolute;left:72px;right:72px;bottom:44px;display:flex;justify-content:space-between;align-items:center">
      ${logo(32)}<div class="mono" style="font-size:24px;color:var(--muted)">getsetcue.com · free 14-day demo</div>
    </div>`), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(OUT, 'setcue-monitors-post.png') }); await b.close();
  console.log('wrote setcue-monitors-ad.mp4 and setcue-monitors-post.png,', TOTAL, 's');
})();
