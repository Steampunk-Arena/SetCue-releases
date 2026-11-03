// Renders the "everything SetCue does" feature graphic into out/: 1080×1350 (Facebook / Instagram feed) and
// 1920×1080 (website, Gumroad, YouTube).
// Usage: node marketing/features/render.js
const path = require('path');
const fs = require('fs');
const { logo, page, renderJobs } = require('../instagram/render.js');

const OUT = path.join(__dirname, 'out');
const APP = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, '..', 'facebook', 'source', 'lyrics.jpg')).toString('base64');

// Features marked `win` are in the Windows version now and coming to Mac and Linux.
const GROUPS = [
  { icon: '🎧', title: 'Mix like a DJ', color: 'var(--pink)', items: [
    ['Two decks + Auto DJ', 'timed auto-fades'],
    ['Tempo walks', 'glide to any BPM'],
    ['6-band EQ', 'per deck, in your recording', 'new'],
    ['Record your mix', 'save it as a WAV'],
  ] },
  { icon: '✨', title: 'Put on a show', color: 'var(--cyan)', items: [
    ['20+ visualizers', 'palettes that hit the beat'],
    ['Every screen', 'pop out or span monitors', 'new'],
    ['Lyrics on screen', 'timed, karaoke style'],
    ['Music videos', 'crossfade the picture', 'win'],
  ] },
  { icon: '💡', title: 'Plug in your gear', color: '#ffd166', items: [
    ['DJ lights', 'DMX-512, on the beat', 'win'],
    ['MIDI controllers', 'map with MIDI learn', 'win'],
    ['Scratching', 'jog wheel or mouse', 'win'],
    ['Headphone cue', 'preview the next track'],
  ] },
  { icon: '💾', title: 'Your music', color: '#b98cff', items: [
    ['Plays your files', 'MP3, WAV, FLAC and more'],
    ['Saved sets', 'BPM and total set time'],
    ['8 themes', 'Neon to Miami Vice'],
    ['No subscription', 'no streaming account'],
  ] },
];

const CSS = `
  .card { border-radius:22px; padding:24px 28px; background:rgba(16,12,30,0.78);
    border:1.5px solid rgba(185,140,255,0.28); box-shadow:0 20px 50px rgba(0,0,0,0.35); }
  .card h2 { display:flex; align-items:center; gap:12px; font-weight:800; letter-spacing:-0.02em; }
  .card b { font-weight:700; }
  .tag { font-family:'JetBrains Mono',monospace; font-size:0.62em; font-weight:700; letter-spacing:0.08em; padding:2px 7px;
    border-radius:6px; vertical-align:2px; margin-left:6px; white-space:nowrap; }
  .tag.win { color:#ffd166; border:1px solid rgba(255,209,102,0.6); }
  .tag.new { color:var(--ink); background:var(--cyan); }
`;

function card({ icon, title, color, items }, size) {
  return `<div class="card">
    <h2 style="font-size:${size * 1.4}px;color:${color}"><span>${icon}</span>${title}</h2>
    <div style="display:flex;flex-direction:column;gap:${size * 0.5}px;margin-top:${size * 0.7}px">${items.map(([name, what, tag]) => `
      <div style="font-size:${size}px;line-height:1.25"><b>${name}</b>${tag ? `<span class="tag ${tag}">${tag === 'win' ? 'WINDOWS' : 'NEW'}</span>` : ''}
        <div style="color:var(--muted);font-size:0.84em;margin-top:2px">${what}</div></div>`).join('')}
    </div>
  </div>`;
}
const grid = (groups, size, style) => `<div style="position:absolute;display:grid;grid-template-columns:1fr 1fr;gap:22px;${style}">${groups.map(g => card(g, size)).join('')}</div>`;

// The app screenshot as a glowing screen; `crop` is in the 3200×2000 screenshot.
function appShot({ x, y, w, h }, left, top, width) {
  const s = width / w;
  return `<div class="screen" style="left:${left}px;top:${top}px;width:${width}px;height:${h * s}px;
    background:url('${APP}') ${-x * s}px ${-y * s}px/${3200 * s}px ${2000 * s}px no-repeat"></div>`;
}

const legend = size => `<span class="tag win" style="font-size:${size}px">WINDOWS</span> in the Windows version now, coming soon to Mac &amp; Linux`;

function portrait() {
  const W = 1080, H = 1350;
  return page(W, H, `<style>${CSS}</style>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 35% at 50% 28%, rgba(123,77,255,0.5), transparent 70%)"></div>
    <div style="position:absolute;left:72px;right:72px;top:54px;display:flex;justify-content:space-between;align-items:center">
      <h1 style="font-size:60px">Everything <em>SetCue</em> does.</h1>${logo(28)}
    </div>
    <div style="position:absolute;left:72px;right:72px;top:128px;font-size:25px;line-height:1.35;color:var(--muted)">Upgrade your space with an offline desktop DJ app that plays both Music and Videos. Available for PC, Mac and Linux Users.</div>
    ${appShot({ x: 0, y: 0, w: 3200, h: 1000 }, 72, 218, 936)}
    ${grid(GROUPS, 21, 'left:72px;right:72px;top:526px')}
    <div style="position:absolute;left:72px;right:72px;bottom:44px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:17px;color:var(--muted);max-width:440px;line-height:1.5">${legend(12)}</div>
      <div class="pill" style="font-size:22px;padding:14px 24px;white-space:nowrap">Free 14-day demo · getsetcue.com</div>
    </div>
  `);
}

function landscape() {
  const W = 1920, H = 1080;
  return page(W, H, `<style>${CSS}</style>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 25% 55%, rgba(123,77,255,0.5), transparent 70%)"></div>
    <div style="position:absolute;left:80px;top:70px">
      ${logo(36)}
      <h1 style="font-size:84px;margin-top:30px">Everything <em>SetCue</em> does.</h1>
      <div style="font-size:28px;line-height:1.35;color:var(--muted);margin-top:16px;max-width:900px">Upgrade your space with an offline desktop DJ app that plays both Music and Videos. Available for PC, Mac and Linux Users.</div>
    </div>
    ${appShot({ x: 0, y: 0, w: 3200, h: 1480 }, 80, 440, 860)}
    ${grid(GROUPS, 24, 'left:1010px;right:76px;top:70px')}
    <div style="position:absolute;left:80px;bottom:56px;font-size:19px;color:var(--muted)">${legend(14)}</div>
    <div class="pill" style="position:absolute;right:76px;bottom:44px;font-size:28px;padding:16px 30px">Free 14-day demo · getsetcue.com</div>
  `);
}

renderJobs([
  ['setcue-features-1080x1350.png', 1080, 1350, portrait()],
  ['setcue-features-1920x1080.png', 1920, 1080, landscape()],
], OUT);
