// Renders the SetCue Gumroad cover images and thumbnail into out/.
// Usage: node marketing/gumroad/render.js
const path = require('path');
const {
  PHOTO, PHOTO_W, PHOTO_H, APP_W, APP_H, MONITOR, logo, screenCrop, page, renderJobs,
} = require('../instagram/render.js');

const OUT = path.join(__dirname, 'out');

// ---------- Cover 1: desk photo + headline (1280×720) ----------
function coverHero() {
  const W = 1280, H = 720;
  const s = 800 / MONITOR.w; // monitor drawn 800px wide
  const dx = W - 40 - (MONITOR.x + MONITOR.w) * s;
  const dy = 0; // photo top flush with the cover so there's no seam
  return page(W, H, `
    <div class="photo" style="left:0;top:0;width:100%;height:100%;
      background-size:${PHOTO_W * s}px ${PHOTO_H * s}px;background-position:${dx}px ${dy}px;
      -webkit-mask-image:linear-gradient(90deg, transparent ${dx + MONITOR.x * s - 220}px, black ${dx + MONITOR.x * s + 40}px);"></div>
    <div style="position:absolute;left:64px;top:72px;width:400px">
      ${logo(34)}
      <h1 style="font-size:70px;margin-top:36px">Your music.<br>Your vibes.<br><em>Let's go.</em></h1>
      <p style="font-size:22px;line-height:1.45;color:var(--muted);margin-top:26px">A desktop DJ player for the<br>music already on your computer.</p>
      <div class="pill" style="font-size:24px;padding:16px 28px;margin-top:34px">Free 14-day demo</div>
    </div>
  `);
}

// ---------- Cover 2: the full app (1280×720) ----------
function coverApp() {
  const W = 1280, H = 720;
  const crop = { x: 0, y: 36, w: APP_W, h: APP_H - 36 };
  const width = 1140;
  const height = crop.h * (width / crop.w);
  return page(W, H, `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 55%, rgba(123,77,255,0.5), transparent 70%)"></div>
    <div style="position:absolute;left:0;right:0;top:34px;display:flex;justify-content:center;align-items:center;gap:28px">
      ${logo(28)}
      <div class="mono" style="font-size:18px;color:var(--muted);letter-spacing:0.12em">TWO DECKS · AUTO FADES · VISUALIZER · SET BUILDER</div>
    </div>
    ${screenCrop(crop, (W - width) / 2, H - height - 36, width)}
  `);
}

// ---------- Cover 3: feature grid (1280×720) ----------
const FEATURES = [
  ['Two decks', 'Now playing + on deck, headphone cue on a separate output'],
  ['Auto DJ', 'Tempo-matched auto fades into the next track'],
  ['Visualizer', '20+ patterns and palettes, lyrics, pop-out second screen'],
  ['Set builder', 'BPM and total set time at a glance; import & export sets'],
  ['Record', 'Record your mix to WAV'],
  ['MIDI', 'Map any USB controller with MIDI learn, plus vinyl-style scratching', true],
  ['Music videos', 'Mix MP4, WebM and MOV videos into your set', true],
  ['DJ lights', 'Drive DMX-512 lights through a USB-DMX cable', true],
];

function coverFeatures() {
  const W = 1280, H = 720;
  const cards = FEATURES.map(([title, body, isNew]) => `
    <div style="position:relative;border:1.5px solid rgba(185,140,255,0.35);border-radius:16px;padding:20px 22px;
      background:rgba(16,18,31,0.6)">
      ${isNew ? `<div class="mono" style="position:absolute;top:18px;right:18px;font-size:12px;color:var(--cyan);letter-spacing:0.12em">NEW</div>` : ''}
      <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em">${title}</div>
      <div style="font-size:16px;line-height:1.4;color:var(--muted);margin-top:8px">${body}</div>
    </div>`).join('');
  return page(W, H, `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 80% 0%, rgba(250,86,176,0.25), transparent 70%)"></div>
    <div style="position:absolute;left:64px;right:64px;top:52px;display:flex;justify-content:space-between;align-items:flex-end">
      <h1 style="font-size:56px">Everything you need<br><em>to play a set.</em></h1>
      ${logo(30)}
    </div>
    <div style="position:absolute;left:64px;right:64px;top:232px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px">${cards}</div>
    <div class="platforms" style="position:absolute;left:64px;right:64px;bottom:40px;font-size:16px;display:flex;justify-content:space-between">
      <span>WINDOWS · MACOS · LINUX</span>
      <span>NEW = WINDOWS NOW, MAC &amp; LINUX COMING SOON</span>
    </div>
  `);
}

// ---------- Thumbnail (600×600) ----------
function thumbnail() {
  const S = 600;
  return page(S, S, `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%, rgba(123,77,255,0.55), transparent 65%)"></div>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">
      <div style="transform:scale(1.5)">${logo(56, { tile: true }).replace(/<span[^>]*>setcue<\/span>/, '')}</div>
      <div style="margin-top:40px">${logo(48).replace(/<svg[\s\S]*?<\/svg>/, '')}</div>
      <div class="mono" style="font-size:20px;color:var(--muted);letter-spacing:0.18em;margin-top:-18px">DESKTOP DJ</div>
    </div>
  `);
}

renderJobs([
  ['cover-1-hero.png', 1280, 720, coverHero()],
  ['cover-2-app.png', 1280, 720, coverApp()],
  ['cover-3-features.png', 1280, 720, coverFeatures()],
  ['thumbnail.png', 600, 600, thumbnail()],
], OUT);
