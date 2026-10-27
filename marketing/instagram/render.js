// Renders the SetCue Instagram set from source/desk-setup.png into out/.
// Usage: node marketing/instagram/render.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = __dirname;
const PHOTO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'source', 'desk-setup.png')).toString('base64');
const PHOTO_W = 1672;
const PHOTO_H = 941;
const OUT = path.join(ROOT, 'out');

// Monitor bounds inside the source photo (px), used to frame every crop.
const MONITOR = { x: 425, y: 70, w: 825, h: 540 };

const CSS = `
  :root {
    --violet: #7b4dff;
    --violet-deep: #1c0a5c;
    --ink: #0b0512;
    --pink: #ff4fd8;
    --cyan: #3ee8ff;
    --text: #f4efff;
    --muted: #b9a8e8;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    color: var(--text);
    background: var(--ink);
    overflow: hidden;
  }
  .canvas {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, #24097f 0%, #1a0757 45%, var(--ink) 100%);
  }
  .photo {
    position: absolute;
    background-image: url('${PHOTO}');
    background-repeat: no-repeat;
  }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .logo { display: flex; align-items: center; gap: 18px; }
  .logo svg { display: block; }
  .logo span {
    font-weight: 800;
    font-style: italic;
    letter-spacing: -0.02em;
    background: linear-gradient(90deg, var(--pink), #b98cff);
    -webkit-background-clip: text;
    color: transparent;
  }
  .kicker {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--cyan);
  }
  h1 {
    font-family: 'Inter Display', 'Inter', sans-serif;
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 0.98;
  }
  h1 em { font-style: normal; color: var(--pink); }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    border-radius: 999px;
    font-weight: 700;
    background: linear-gradient(90deg, var(--pink), var(--violet));
    color: white;
    box-shadow: 0 0 40px rgba(255, 79, 216, 0.45);
  }
  .platforms {
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    letter-spacing: 0.08em;
  }
  .screen {
    position: absolute;
    overflow: hidden;
    border-radius: 22px;
    border: 2px solid rgba(185, 140, 255, 0.55);
    box-shadow: 0 0 0 8px rgba(123, 77, 255, 0.12), 0 0 80px rgba(255, 79, 216, 0.35), 0 30px 80px rgba(0, 0, 0, 0.6);
    background-color: var(--ink);
  }
  .dots { display: flex; gap: 12px; }
  .dots i { width: 14px; height: 14px; border-radius: 50%; background: rgba(255,255,255,0.25); }
  .dots i.on { background: var(--pink); box-shadow: 0 0 14px var(--pink); }
`;

function logo(size) {
  const h = size;
  const bars = [0.45, 0.8, 1, 0.65, 0.35];
  const bw = h * 0.12;
  const gap = h * 0.08;
  const rects = bars
    .map((b, i) => {
      const bh = h * b;
      return `<rect x="${i * (bw + gap)}" y="${(h - bh) / 2}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="url(#g)"/>`;
    })
    .join('');
  const w = bars.length * (bw + gap) - gap;
  return `<div class="logo">
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3ee8ff"/><stop offset="1" stop-color="#ff4fd8"/>
      </linearGradient></defs>${rects}
    </svg>
    <span style="font-size:${h * 1.05}px">setcue</span>
  </div>`;
}

// Places the source photo so that the source rect {x, y, w} fills `dw` px of width
// with its top-left corner at (dx, dy) on the canvas.
function photoAt({ x, y, w }, dx, dy, dw, extraStyle = '') {
  const s = dw / w;
  return `<div class="photo" style="left:0;top:0;width:100%;height:100%;
    background-size:${PHOTO_W * s}px ${PHOTO_H * s}px;
    background-position:${dx - x * s}px ${dy - y * s}px;${extraStyle}"></div>`;
}

// A cropped region of the on-screen UI, shown as a glowing "screen" card.
function screenCrop({ x, y, w, h }, left, top, width) {
  const s = width / w;
  return `<div class="screen" style="left:${left}px;top:${top}px;width:${width}px;height:${h * s}px;
    background-image:url('${PHOTO}');background-repeat:no-repeat;
    background-size:${PHOTO_W * s}px ${PHOTO_H * s}px;
    background-position:${-x * s}px ${-y * s}px;"></div>`;
}

function page(w, h, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
  <body><div class="canvas" style="width:${w}px;height:${h}px">${body}</div></body></html>`;
}

// ---------- Feed hero (4:5) ----------
function feedHero({ swipe = false } = {}) {
  const W = 1080, H = 1350;
  const dw = 1700; // width the monitor-centred photo is drawn at
  const s = dw / PHOTO_W;
  const monitorCx = (MONITOR.x + MONITOR.w / 2) * s;
  const dx = W / 2 - monitorCx;
  const dy = H - PHOTO_H * s + 40;
  return page(W, H, `
    <div class="photo" style="left:0;top:0;width:100%;height:100%;
      background-size:${PHOTO_W * s}px ${PHOTO_H * s}px;background-position:${dx}px ${dy}px;
      -webkit-mask-image:linear-gradient(180deg, transparent ${dy - 10}px, black ${dy + 220}px);"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, transparent 72%, rgba(11,5,18,0.92) 100%)"></div>
    <div style="position:absolute;left:72px;top:72px;right:72px">
      ${logo(46)}
      <h1 style="font-size:104px;margin-top:44px">Your music.<br>Your vibes.<br><em>Let's go.</em></h1>
    </div>
    <div style="position:absolute;left:72px;right:72px;bottom:64px;display:flex;align-items:center;justify-content:space-between">
      <div class="pill" style="font-size:32px;padding:22px 36px">Free 14-day demo</div>
      ${swipe
        ? `<div class="mono" style="font-size:28px;color:var(--text);letter-spacing:0.1em">SWIPE →</div>`
        : `<div class="platforms" style="font-size:22px;white-space:nowrap">WINDOWS · MACOS · LINUX</div>`}
    </div>
  `);
}

// ---------- Story (9:16) ----------
function story() {
  const W = 1080, H = 1920;
  const dw = 1800;
  const s = dw / PHOTO_W;
  const monitorCx = (MONITOR.x + MONITOR.w / 2) * s;
  const dx = W / 2 - monitorCx;
  const dy = 560;
  const ph = PHOTO_H * s;
  return page(W, H, `
    <div class="photo" style="left:0;top:0;width:100%;height:100%;
      background-size:${PHOTO_W * s}px ${ph}px;background-position:${dx}px ${dy}px;
      -webkit-mask-image:linear-gradient(180deg, transparent ${dy - 10}px, black ${dy + 200}px, black ${dy + ph - 260}px, transparent ${dy + ph}px);"></div>
    <div style="position:absolute;left:80px;right:80px;top:150px">
      ${logo(50)}
      <h1 style="font-size:112px;margin-top:56px">Your music.<br>Your vibes.<br><em>Let's go.</em></h1>
    </div>
    <div style="position:absolute;left:80px;right:80px;bottom:250px;text-align:center">
      <div class="mono" style="font-size:30px;color:var(--muted);line-height:1.5">A desktop DJ player<br>for your own music files</div>
      <div class="pill" style="font-size:38px;padding:26px 48px;margin-top:40px">Try it free for 14 days</div>
      <div class="platforms" style="font-size:24px;margin-top:30px">WINDOWS · MACOS · LINUX</div>
    </div>
  `);
}

// ---------- Carousel feature slides (4:5) ----------
const FEATURES = [
  {
    file: 'carousel-02-decks.png',
    kicker: 'Two decks',
    title: 'Now playing.<br><em>On deck.</em>',
    body: 'Load the next track while the current one plays, with level and headphone cue on each deck.',
    crop: { x: 452, y: 220, w: 440, h: 142 },
  },
  {
    file: 'carousel-03-tempo.png',
    kicker: 'Auto DJ',
    title: 'Tempo-matched<br><em>auto fades.</em>',
    body: 'Set a target BPM, pick a fade length, and let SetCue walk the tempo and crossfade into the next track.',
    crop: { x: 455, y: 368, w: 435, h: 125 },
  },
  {
    file: 'carousel-04-visualizer.png',
    kicker: 'Visualizer',
    title: 'Watch the<br><em>music move.</em>',
    body: 'Built-in visualizer styles and colour schemes, plus a lyrics display, all running alongside your set.',
    crop: { x: 448, y: 122, w: 760, h: 90 },
  },
  {
    file: 'carousel-05-playlist.png',
    kicker: 'Set builder',
    title: 'Build the set.<br><em>Record the mix.</em>',
    body: 'Arrange tracks, see BPM and total set length at a glance, save your sets, and hit record.',
    crop: { x: 876, y: 228, w: 336, h: 300 },
  },
  {
    file: 'carousel-06-outputs.png',
    kicker: 'Outputs',
    title: 'Speakers out.<br><em>Cue in your cans.</em>',
    body: 'Send the main mix to your speakers and a pre-fader cue to your headphones.',
    crop: { x: 462, y: 503, w: 430, h: 64 },
  },
];
const SLIDE_COUNT = FEATURES.length + 2;

function dots(active) {
  return `<div class="dots">${Array.from({ length: SLIDE_COUNT }, (_, i) =>
    `<i class="${i === active ? 'on' : ''}"></i>`).join('')}</div>`;
}

function featureSlide(f, index) {
  const W = 1080, H = 1350;
  const cardW = 936;
  const cardH = f.crop.h * (cardW / f.crop.w);
  const maxCardH = 560;
  const width = cardH > maxCardH ? cardW * (maxCardH / cardH) : cardW;
  const height = f.crop.h * (width / f.crop.w);
  const left = (W - width) / 2;
  const top = 470 + (maxCardH - height) / 2;
  return page(W, H, `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 45% at 50% ${(top + height / 2) / H * 100}%, rgba(255,79,216,0.22), transparent 70%)"></div>
    <div style="position:absolute;left:72px;right:72px;top:72px;display:flex;justify-content:space-between;align-items:center">
      ${logo(34)}
      <div class="mono" style="font-size:24px;color:var(--muted)">${String(index + 1).padStart(2, '0')} / ${String(SLIDE_COUNT).padStart(2, '0')}</div>
    </div>
    <div style="position:absolute;left:72px;right:72px;top:190px">
      <div class="kicker" style="font-size:26px">${f.kicker}</div>
      <h1 style="font-size:88px;margin-top:22px">${f.title}</h1>
    </div>
    ${screenCrop(f.crop, left, top, width)}
    <div style="position:absolute;left:72px;right:72px;top:1160px;display:flex;justify-content:space-between;align-items:flex-end;gap:48px">
      <p style="font-size:30px;line-height:1.4;color:var(--muted);max-width:760px">${f.body}</p>
    </div>
    <div style="position:absolute;left:72px;bottom:56px">${dots(index)}</div>
  `);
}

function ctaSlide() {
  const W = 1080, H = 1350;
  const crop = MONITOR;
  const width = 900;
  const height = crop.h * (width / crop.w);
  return page(W, H, `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 40% at 50% 34%, rgba(123,77,255,0.45), transparent 70%)"></div>
    ${screenCrop({ x: crop.x + 20, y: crop.y + 15, w: crop.w - 40, h: crop.h - 60 }, (W - width) / 2, 110, width)}
    <div style="position:absolute;left:72px;right:72px;top:${110 + height + 40}px;text-align:center">
      <div style="display:flex;justify-content:center">${logo(46)}</div>
      <h1 style="font-size:84px;margin-top:30px">Try every feature<br><em>free for 14 days.</em></h1>
      <div class="pill" style="font-size:32px;padding:22px 40px;margin-top:40px">Link in bio</div>
      <div class="platforms" style="font-size:24px;margin-top:28px">WINDOWS · MACOS · LINUX</div>
    </div>
    <div style="position:absolute;left:72px;bottom:56px">${dots(SLIDE_COUNT - 1)}</div>
  `);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['feed-hero.png', 1080, 1350, feedHero()],
    ['story.png', 1080, 1920, story()],
    ['carousel-01-cover.png', 1080, 1350, feedHero({ swipe: true })],
    ...FEATURES.map((f, i) => [f.file, 1080, 1350, featureSlide(f, i + 1)]),
    [`carousel-0${SLIDE_COUNT}-cta.png`, 1080, 1350, ctaSlide()],
  ];
  const browser = await chromium.launch();
  const page_ = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [name, w, h, html] of jobs) {
    await page_.setViewportSize({ width: w, height: h });
    await page_.setContent(html, { waitUntil: 'load' });
    await page_.evaluate(() => document.fonts.ready);
    await page_.screenshot({ path: path.join(OUT, name), clip: { x: 0, y: 0, width: w, height: h } });
    console.log('wrote', name);
  }
  await browser.close();
})();
