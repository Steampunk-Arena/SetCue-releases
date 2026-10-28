// Renders the SetCue Facebook Page set into out/: profile icon, cover banner and five how-to posts.
// Usage: node marketing/facebook/render.js
const path = require('path');
const fs = require('fs');
const { PHOTO, PHOTO_W, PHOTO_H, MONITOR, logo, page, renderJobs } = require('../instagram/render.js');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'out');
const ICON_SVG = fs.readFileSync(path.join(ROOT, '..', 'instagram', 'source', 'setcue-icon.svg'), 'utf8');
const BARS = ICON_SVG.match(/<rect x="(?!48")[^>]*\/>/g).join('');

// App screenshots from the SetCue preview, captured at 3200×2000 (2× a 1600×1000 window).
const SHOT_W = 3200;
const SHOT_H = 2000;
const shots = {};
for (const f of fs.readdirSync(path.join(ROOT, 'source'))) {
  if (f.endsWith('.jpg')) shots[f.slice(0, -4)] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'source', f)).toString('base64');
}

// A region of a screenshot, shown as a glowing "screen" card `width` px wide.
function shot(name, { x, y, w, h }, left, top, width, extra = '') {
  const s = width / w;
  return `<div class="screen" style="left:${left}px;top:${top}px;width:${width}px;height:${h * s}px;
    background-image:url('${shots[name]}');background-repeat:no-repeat;
    background-size:${SHOT_W * s}px ${SHOT_H * s}px;background-position:${-x * s}px ${-y * s}px;${extra}"></div>`;
}

const FOOTER = `
  <div style="position:absolute;left:72px;right:72px;bottom:60px;display:flex;justify-content:space-between;align-items:center">
    ${logo(34)}
    <div class="mono" style="font-size:24px;color:var(--muted);letter-spacing:0.06em">getsetcue.com · free 14-day demo</div>
  </div>`;

// ---------- Profile icon (720×720; Facebook shows it in a circle) ----------
function icon() {
  const S = 720;
  return page(S, S, `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%, #3a1596 0%, #1a0757 55%, var(--ink) 100%)"></div>
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
      <svg width="420" height="${420 * 420 / 484}" viewBox="270 302 484 420" style="filter:drop-shadow(0 0 36px rgba(250,86,176,0.5))">${BARS}</svg>
    </div>
  `);
}

// ---------- Cover banner (1640×624) ----------
// Facebook centres the profile picture over the bottom of the cover and crops the sides on phones,
// to about the middle 1100 px, so the headline sits inside x 300-700.
function banner() {
  const W = 1640, H = 624;
  const s = 780 / MONITOR.w;
  const dx = W - 30 - (MONITOR.x + MONITOR.w) * s;
  const dy = 40 - MONITOR.y * s;
  return page(W, H, `
    <div class="photo" style="left:0;top:0;width:100%;height:100%;
      background-size:${PHOTO_W * s}px ${PHOTO_H * s}px;background-position:${dx}px ${dy}px;
      -webkit-mask-image:linear-gradient(90deg, transparent ${dx + MONITOR.x * s - 260}px, black ${dx + MONITOR.x * s + 30}px);"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, transparent 60%, rgba(11,5,18,0.55) 100%)"></div>
    <div style="position:absolute;left:300px;top:100px;width:440px">
      ${logo(36)}
      <h1 style="font-size:68px;margin-top:26px">Your music.<br>Your vibes.<br><em>Let's go.</em></h1>
      <p class="mono" style="font-size:18px;color:var(--cyan);letter-spacing:0.12em;margin-top:24px">DESKTOP DJ · FREE 14-DAY DEMO</p>
    </div>
  `);
}

// ---------- How-to posts (1080×1350) ----------
function steps(list) {
  return `<ol style="list-style:none;display:flex;flex-direction:column;gap:22px">${list.map((t, i) => `
    <li style="display:flex;gap:22px;align-items:flex-start;font-size:31px;line-height:1.32">
      <span class="mono" style="flex:none;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:24px;font-weight:700;background:linear-gradient(135deg,var(--pink),var(--violet));color:white;margin-top:-4px">${i + 1}</span>
      <span>${t}</span>
    </li>`).join('')}</ol>`;
}

function post({ kicker, title, list, visual, note = '' }) {
  const W = 1080, H = 1350;
  return page(W, H, `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 40% at 50% 30%, rgba(250,86,176,0.18), transparent 70%)"></div>
    <div style="position:absolute;left:72px;right:72px;top:68px">
      <div class="kicker" style="font-size:24px">${kicker}</div>
      <h1 style="font-size:76px;margin-top:18px">${title}</h1>
    </div>
    ${visual}
    <div style="position:absolute;left:72px;right:72px;top:868px">${steps(list)}
      ${note ? `<p class="mono" style="font-size:20px;color:var(--muted);margin-top:26px;letter-spacing:0.04em">${note}</p>` : ''}
    </div>
    ${FOOTER}
  `);
}

const posts = [
  ['post-1-save-a-playlist.png', post({
    kicker: 'How to · Save a playlist',
    title: 'Build a set once.<br><em>Play it all night.</em>',
    visual: shot('playlist', { x: 1700, y: 1180, w: 1460, h: 560 }, 72, 300, 936)
      + shot('new-set', { x: 1040, y: 820, w: 1120, h: 360 }, 388, 560, 620),
    list: [
      'Click <b>+ New set</b> and give it a name.',
      'Drag in your songs, or click <b>+ Add</b>. Drag rows to reorder.',
      'That\'s it: sets save automatically. Use <b>Export set</b> to share one.',
    ],
  })],
  ['post-2-customize-your-theme.png', post({
    kicker: 'How to · Customize your look',
    title: 'Make SetCue<br><em>match your vibe.</em>',
    visual: ['theme-neon', 'theme-miami', 'theme-gold', 'theme-chrome'].map((n, i) =>
      shot(n, { x: 0, y: 0, w: 3200, h: 1500 }, 72 + (i % 2) * 476, 300 + Math.floor(i / 2) * 270, 460)).join(''),
    list: [
      'Pick a theme top right: Neon Violet, Miami Vice, Gold &amp; Silver, Arctic Chrome and more.',
      'Choose a visualizer pattern and colors on the visualizer bar.',
      'Turn on cycling and SetCue shuffles patterns and colors for you.',
    ],
  })],
  ['post-3-set-up-dmx-lights.png', post({
    kicker: 'How to · DJ lights (DMX)',
    title: 'Your lights,<br><em>on the beat.</em>',
    visual: shot('dmx-modal', { x: 680, y: 290, w: 1840, h: 1000 }, 72, 300, 936),
    list: [
      'Plug a USB-DMX cable into your PC and daisy-chain your lights.',
      'Settings → <b>Set up DJ lights</b>: choose the cable, then <b>+ Add light</b> for each one.',
      'Switch on <b>Lights follow the music</b>. Colors follow the visualizer.',
    ],
    note: 'Windows version. Test each light with Test channels before a show.',
  })],
  ['post-4-play-music-videos.png', post({
    kicker: 'How to · Music videos',
    title: 'Mix the music.<br><em>Mix the picture.</em>',
    visual: shot('video', { x: 36, y: 112, w: 3128, h: 1372 }, 72, 300, 936),
    list: [
      'Click <b>+ Add</b> and pick MP4, WebM or MOV videos, just like songs.',
      'The video takes the visualizer\'s place, and the crossfader blends pictures.',
      'Pop it out to a second screen or a TV for the crowd.',
    ],
    note: 'Windows version. Mix videos under the visualizer in Visualizer settings.',
  })],
  ['post-5-covers-and-lyrics-with-ai.png', post({
    kicker: 'How to · Covers &amp; lyrics with AI',
    title: 'No cover? No lyrics?<br><em>Make them with AI.</em>',
    visual: shot('lyrics', { x: 760, y: 560, w: 1680, h: 520 }, 72, 300, 936)
      + shot('lyrics', { x: 40, y: 1160, w: 760, h: 240 }, 72, 615, 456)
      + shot('lyrics', { x: 1720, y: 1400, w: 1000, h: 316 }, 552, 615, 456),
    list: [
      'Make square art with an AI image tool and embed it in the song with a tag editor like Mp3tag.',
      'Use an AI transcription tool to time your lyrics, and save them as an .lrc file named like the song.',
      'In SetCue: Settings → <b>Refresh album covers</b> and <b>Scan lyrics</b>.',
    ],
  })],
];

// ---------- Introduction post with the launch discount (1080×1350) ----------
function intro() {
  const W = 1080, H = 1350;
  return page(W, H, `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 40% at 50% 38%, rgba(123,77,255,0.45), transparent 70%)"></div>
    <div style="position:absolute;left:72px;right:72px;top:68px">
      <div class="kicker" style="font-size:24px">Meet SetCue · Desktop DJ</div>
      <h1 style="font-size:80px;margin-top:18px">Your music. Your vibes.<br><em>Let's go.</em></h1>
    </div>
    ${shot('lyrics', { x: 0, y: 0, w: 3200, h: 2000 }, 72, 300, 936)}
    <div style="position:absolute;left:72px;right:72px;top:${300 + 2000 * 936 / 3200 + 52}px;display:flex;align-items:center;gap:44px">
      <div style="flex:none;text-align:center;padding:26px 34px;border-radius:24px;background:linear-gradient(135deg,var(--pink),var(--violet));box-shadow:0 0 50px rgba(250,86,176,0.45)">
        <div style="font-size:92px;font-weight:800;letter-spacing:-0.04em;line-height:1">15% off</div>
        <div class="mono" style="font-size:22px;letter-spacing:0.16em;margin-top:10px">LAUNCH OFFER</div>
      </div>
      <div>
        <div style="font-size:32px;line-height:1.35">For our first customers: use code</div>
        <div style="display:inline-block;font-size:56px;font-weight:800;color:var(--cyan);letter-spacing:0.06em;
          border:3px dashed var(--cyan);border-radius:14px;padding:6px 22px;margin-top:12px">15OFF</div>
        <div style="font-size:26px;line-height:1.4;color:var(--muted);margin-top:14px">Try every feature free for 14 days first.</div>
      </div>
    </div>
    ${FOOTER}
  `);
}

// ---------- Follow for updates, over a Starburst sneak peek (1080×1350) ----------
// source/starburst.jpg is a 1920×1000 frame of the Starburst pattern (Liquid Gold palette).
function follow() {
  const W = 1080, H = 1350;
  const coming = [
    ['New visualizers', 'like Starburst, a gold light-speed burst'],
    ['Mac &amp; Linux updates', 'music videos, DJ lights and MIDI'],
    ['A Windows installer', 'with Start menu and desktop shortcuts'],
  ];
  return page(W, H, `
    <div style="position:absolute;inset:0;background:url('${shots.starburst}') center/auto 100% no-repeat;filter:saturate(1.25) brightness(1.15)"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,0.9) 0%, rgba(11,5,18,0.4) 20%, rgba(11,5,18,0) 32%, rgba(11,5,18,0) 58%, rgba(11,5,18,0.85) 70%, rgba(11,5,18,0.97) 100%)"></div>
    <div style="position:absolute;left:72px;right:72px;top:68px">
      <div class="kicker" style="font-size:24px">Follow SetCue</div>
      <h1 style="font-size:84px;margin-top:18px">More is coming.<br><em>Don't miss it.</em></h1>
    </div>
    <div class="mono" style="position:absolute;right:72px;top:560px;font-size:20px;letter-spacing:0.16em;padding:10px 18px;border-radius:999px;
      background:rgba(11,5,18,0.7);border:1.5px solid rgba(255,214,120,0.7);color:#ffe08a">SNEAK PEEK · STARBURST</div>
    <div style="position:absolute;left:72px;right:72px;top:930px">
      <div class="kicker" style="font-size:22px;color:var(--muted)">On the way</div>
      <div style="display:flex;flex-direction:column;gap:16px;margin-top:18px">${coming.map(([t, d]) => `
        <div style="font-size:32px;line-height:1.3"><b>${t}</b> <span style="color:var(--muted)">· ${d}</span></div>`).join('')}
      </div>
    </div>
    ${FOOTER}
  `);
}

// ---------- Quote cards (1080×1350) ----------
// One big quote over a full-bleed background: a 1080×1350 visualizer frame (source/bg-*.jpg) or the desk photo.
// `at` puts the quote at the top or bottom, whichever side the background leaves dark.
function quoteCard({ quote, who, bg, at = 'top', size = 92 }) {
  const W = 1080, H = 1350;
  const back = bg === 'desk'
    ? photoBackground()
    : `<div style="position:absolute;inset:0;background:url('${shots[bg]}') center/cover no-repeat"></div>`;
  const shade = at === 'top'
    ? 'linear-gradient(180deg, rgba(11,5,18,0.9) 0%, rgba(11,5,18,0.6) 34%, rgba(11,5,18,0) 55%, rgba(11,5,18,0) 82%, rgba(11,5,18,0.85) 100%)'
    : 'linear-gradient(180deg, rgba(11,5,18,0.35) 0%, rgba(11,5,18,0) 18%, rgba(11,5,18,0) 42%, rgba(11,5,18,0.75) 62%, rgba(11,5,18,0.96) 100%)';
  const text = `
    ${who ? '<div style="font-size:150px;line-height:0.6;font-weight:800;color:var(--pink);height:64px">“</div>' : ''}
    <h1 style="font-size:${size}px;line-height:1.04">${quote}</h1>
    ${who ? `<div class="mono" style="font-size:28px;color:var(--cyan);letter-spacing:0.08em;margin-top:30px">— ${who}</div>` : ''}`;
  return page(W, H, `
    ${back}
    <div style="position:absolute;inset:0;background:${shade}"></div>
    <div style="position:absolute;left:72px;right:72px;${at === 'top' ? 'top:96px' : 'bottom:190px'}">${text}</div>
    ${FOOTER}
  `);
}

// The desk photo, cropped to portrait around the monitor.
function photoBackground() {
  const H = 1350, s = H / PHOTO_H;
  const dx = 540 - (MONITOR.x + MONITOR.w / 2) * s;
  return `<div class="photo" style="left:0;top:0;width:100%;height:100%;background-size:${PHOTO_W * s}px ${H}px;background-position:${dx}px 0"></div>`;
}

const quotes = [
  ['quote-1-founder.png', { quote: 'I built a music mixer for myself because I couldn\'t afford the subscription fees.', who: 'Steve D., Founder', bg: 'desk', at: 'bottom', size: 74 }],
  ['quote-2-llama.png', { quote: 'It really kicks the llama\'s ass.', who: 'Old music hound', bg: 'bg-cargrid', at: 'top' }],
  ['quote-3-mood-lighting.png', { quote: 'I love ambient mood lighting.', who: 'Gamer', bg: 'bg-gateway', at: 'top' }],
  ['quote-4-second-monitor.png', { quote: 'My second monitor finally has a job.', who: 'Desk setup guy', bg: 'bg-helix', at: 'bottom' }],
  ['quote-5-sizzle.png', { quote: 'Your space could use more <em>sizzle.</em>', who: '', bg: 'bg-hyperspace', at: 'bottom', size: 104 }],
];

renderJobs([
  ...quotes.map(([name, q]) => [name, 1080, 1350, quoteCard(q)]),
  ['post-6-follow-for-updates.png', 1080, 1350, follow()],
  ['post-0-introducing-setcue.png', 1080, 1350, intro()],
  ['profile-icon.png', 720, 720, icon()],
  ['cover-banner.png', 1640, 624, banner()],
  ...posts.map(([name, html]) => [name, 1080, 1350, html]),
], OUT);
