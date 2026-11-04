// Animates the portrait feature graphic: the visualizer in the top window plays Neon Gateway to a demo song with
// its timed lyrics, and the window's glow pulses on the beat. Writes out/setcue-features.gif (540×675, loops)
// and out/setcue-features.mp4 (1080×1350, with the song); with `square`, out/setcue-features-square.gif (540×540)
// and .mp4 (1080×1080).
// Usage: node marketing/features/animate.js <SetCue app repo> <Outrunning Ghosts.mp3> <Outrunning Ghosts.lrc> [square]
// Run render.js first; this animates its out/setcue-features-1080x1350.png.
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const [APP, SONG, LRC, LAYOUT = 'portrait'] = process.argv.slice(2);
// The top window and its visualizer area in each layout of the graphic.
const LAYOUTS = {
  portrait: { H: 1350, top: 218, base: 'setcue-features-1080x1350.png', name: 'setcue-features' },
  square: { H: 1080, top: 196, base: 'setcue-features-1080x1080.png', name: 'setcue-features-square' },
};
const L = LAYOUTS[LAYOUT];
const W = 1080, H = L.H, FPS = 20;
const START = 57.0;                               // from "Every second counts when you're racing with the clock"
const DUR = 10;                                   // 15 beats of the song's 90 BPM
const OUT = path.join(__dirname, 'out');
const WORK = path.join(__dirname, 'work', LAYOUT);
const BASE = path.join(OUT, L.base);
const CARD = { x: 72, y: L.top, w: 936, h: 292 };
const VIS = { x: 85, y: L.top + 64, w: 914, h: 285 };
fs.mkdirSync(path.join(WORK, 'frames'), { recursive: true });
const ff = (...args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// Timed lyric lines, relative to the clip start.
const lyrics = fs.readFileSync(LRC, 'utf8').split('\n').map(l => /^\[(\d+):(\d+\.\d+)\]\s*(.*)$/.exec(l)).filter(Boolean)
  .map(m => ({ t: Number(m[1]) * 60 + Number(m[2]) - START, text: m[3] }));
const lyricAt = t => lyrics.filter(l => l.t <= t).at(-1)?.text || '';

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;width:${W}px;height:${H}px;background:url('/base.png') 0 0/${W}px ${H}px no-repeat;font-family:Inter,sans-serif;overflow:hidden}
  #clip{position:absolute;left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;border-radius:22px;overflow:hidden}
  #c{position:absolute;left:${VIS.x - CARD.x}px;top:${VIS.y - CARD.y}px;width:${VIS.w}px;height:${VIS.h}px}
  #lyric{position:absolute;left:${VIS.x}px;width:${VIS.w}px;top:${CARD.y + CARD.h - 40}px;text-align:center;font-size:14.5px;font-weight:500;color:#d58cff;text-shadow:0 0 8px rgba(0,0,0,.9)}
  #glow{position:absolute;left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;border-radius:22px;box-sizing:border-box;pointer-events:none}
</style></head><body><div id="clip"><canvas id="c"></canvas></div><div id="lyric"></div><div id="glow"></div></body></html>`;

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((q, r) => {
      const u = decodeURI(q.url.split('?')[0]);
      if (u === '/') { r.setHeader('content-type', 'text/html'); return r.end(html); }
      const f = u === '/song.wav' ? path.join(WORK, 'song.wav') : u === '/base.png' ? BASE : path.join(APP, u);
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.mjs') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream' }); r.end(d); });
    }).listen(0, () => resolve(srv));
  });
}

(async () => {
  ff('-ss', String(START - 2), '-t', String(DUR + 3), '-i', SONG, '-ac', '2', '-ar', '44100', path.join(WORK, 'song.wav'));
  const srv = await serve();
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: W, height: H } });
  tab.on('pageerror', e => console.log('page error:', e.message));
  await tab.goto(`http://localhost:${srv.address().port}/`);
  await tab.evaluate(() => document.fonts.ready);

  // The 64 bands exactly as the app computes them, read offline at every frame (2 s of lead-in first).
  const frames = Math.round(DUR * FPS), lead = 2 * FPS;
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

  await tab.evaluate(() => import('/src/renderer/visualizer.mjs').then(m => {
    window.v = new m.NeonVisualizer(document.getElementById('c')); window.t = 1000; window.avg = 0; window.kick = 0;
  }));
  // Draw a frame, and pulse the window's glow on bass rises over the recent bass level.
  const step = (fr, lyric) => tab.evaluate(([fr, lyric, FPS]) => {
    window.t += 1000 / FPS;
    window.v.draw({ mode: 'local', ...fr, settings: { style: 'neon-gateway', palette: 'ultraviolet', glow: 24 } }, window.t);
    const bass = fr.bands.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255;
    window.kick = Math.max(window.kick * 0.72, Math.min(1, Math.max(0, bass - window.avg) * 5));
    window.avg += (bass - window.avg) * 0.15;
    const k = window.kick;
    document.getElementById('glow').style.boxShadow =
      `0 0 ${18 + 50 * k}px ${4 + 10 * k}px rgba(250,86,176,${0.25 + 0.55 * k}), 0 0 ${60 + 90 * k}px rgba(123,77,255,${0.35 + 0.45 * k}), inset 0 0 0 ${2 + k}px rgba(255,150,230,${0.35 + 0.6 * k})`;
    document.getElementById('lyric').textContent = lyric;
  }, [fr, lyric, FPS]);
  for (let i = 0; i < lead; i++) await step(spectrum[i], '');
  for (let f = 0; f < frames; f++) {
    await step(spectrum[lead + f], lyricAt(f / FPS));
    await tab.screenshot({ path: path.join(WORK, 'frames', String(f).padStart(4, '0') + '.png') });
  }
  await browser.close(); srv.close();

  const seq = path.join(WORK, 'frames', '%04d.png');
  ff('-framerate', String(FPS), '-i', seq, '-ss', String(START), '-i', SONG, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
    '-af', `afade=in:d=0.2,afade=out:st=${(DUR - 0.6).toFixed(2)}:d=0.6`, '-t', DUR.toFixed(2), '-movflags', '+faststart', path.join(OUT, `${L.name}.mp4`));
  ff('-framerate', String(FPS), '-i', seq, '-filter_complex',
    '[0]scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
    '-loop', '0', path.join(OUT, `${L.name}.gif`));
  console.log(`wrote ${L.name}.gif and ${L.name}.mp4,`, frames, 'frames');
})();
