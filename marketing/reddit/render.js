// Renders SetCue thumbnails for Reddit into out/: three concepts, each at 1080×1080 (image posts and feed),
// 1200×628 (link previews and ads) and 400×300 (ad thumbnails). Text is kept to a few large words because
// Reddit shows thumbnails at about 140 px.
// Usage: node marketing/reddit/render.js
const path = require('path');
const fs = require('fs');
const { logo, page, renderJobs } = require('../instagram/render.js');

const OUT = path.join(__dirname, 'out');
const img = (file, type = 'jpeg') => `data:image/${type};base64,` + fs.readFileSync(file).toString('base64');
const FB = path.join(__dirname, '..', 'facebook', 'source');
const APP = img(path.join(FB, 'lyrics.jpg'));                                // 3200×2000 app screenshot
const GATEWAY = img(path.join(FB, 'bg-gateway.jpg'));                         // 1080×1350 visualizer frame
const WALL = img(path.join(__dirname, 'source', 'monitor-wall.png'), 'png'); // 1080×1920 spanned monitor wall

const SIZES = [['1080x1080', 1080, 1080], ['1200x628', 1200, 628], ['400x300', 400, 300]];
const shadow = 'text-shadow:0 0.04em 0.4em rgba(0,0,0,.85)';

// Each concept lays itself out from the canvas size; `u` is 1% of the shorter side.
const CONCEPTS = {
  // The founder story, over the app itself.
  'built-it': (W, H) => {
    const u = Math.min(W, H) / 100, wide = W / H > 1.2;
    return `
      <div style="position:absolute;inset:0;background:url('${APP}') ${wide ? '0 0' : '18% 0'}/${wide ? `${W * 1.05}px auto` : `auto ${H * 0.95}px`} no-repeat;filter:saturate(1.15)"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(${wide ? '90deg' : '180deg'}, rgba(11,5,18,.95) 0%, rgba(11,5,18,.85) 42%, rgba(11,5,18,.2) 75%, rgba(11,5,18,.1) 100%)"></div>
      <div style="position:absolute;left:${6 * u}px;${wide ? `top:50%;transform:translateY(-50%);width:${W * (W / H > 1.6 ? 0.5 : 0.7)}px` : `right:${6 * u}px;top:${7 * u}px`}">
        <h1 style="font-size:${(W / H > 1.6 ? 13 : 12.5) * u}px;line-height:1;${shadow}">I built my own<br><em>DJ app.</em></h1>
        <div style="font-size:${(wide ? 5.4 : 5.6) * u}px;font-weight:700;margin-top:${3 * u}px;${shadow}">No subscription.<br>Plays your files.</div>
      </div>
      <div style="position:absolute;left:${6 * u}px;bottom:${5 * u}px">${logo(5.5 * u)}</div>`;
  },
  // The light show: a Neon Gateway frame.
  'light-show': (W, H) => {
    const u = Math.min(W, H) / 100, wide = W / H > 1.2;
    return `
      <div style="position:absolute;inset:0;background:url('${GATEWAY}') center ${wide ? '62%' : '70%'}/cover no-repeat;filter:brightness(1.25) saturate(1.2)"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,.85) 0%, rgba(11,5,18,.2) 45%, rgba(11,5,18,0) 70%, rgba(11,5,18,.6) 100%)"></div>
      <div style="position:absolute;left:${6 * u}px;right:${6 * u}px;top:${6 * u}px;text-align:center">
        <h1 style="font-size:${(wide ? 14 : 13) * u}px;line-height:1;${shadow}">Your music.<br><em>A light show.</em></h1>
      </div>
      <div style="position:absolute;left:0;right:0;bottom:${5 * u}px;display:flex;justify-content:center">${logo(5.5 * u)}</div>`;
  },
  // Monitor spanning: the wall as one picture.
  'one-screen': (W, H) => {
    const u = Math.min(W, H) / 100, wide = W / H > 1.2;
    return `
      <div style="position:absolute;inset:0;background:url('${WALL}') center ${wide ? '42%' : '38%'}/${wide ? `${W * 1.05}px auto` : `${W * 1.1}px auto`} no-repeat;filter:brightness(1.35) saturate(1.2)"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(11,5,18,.9) 0%, rgba(11,5,18,.1) 34%, rgba(11,5,18,0) 70%, rgba(11,5,18,.85) 100%)"></div>
      <div style="position:absolute;left:${5 * u}px;right:${5 * u}px;top:${5 * u}px;text-align:center">
        <h1 style="font-size:${(wide ? 12.5 : 12) * u}px;line-height:1;${shadow}">${W / H > 1.6 ? 'Every monitor.' : 'Every monitor.<br>'} <em>One picture.</em></h1>
      </div>
      <div style="position:absolute;left:0;right:0;bottom:${5 * u}px;display:flex;justify-content:center">${logo(5.5 * u)}</div>`;
  },
};

renderJobs(Object.entries(CONCEPTS).flatMap(([name, build]) =>
  SIZES.map(([size, W, H]) => [`reddit-${name}-${size}.png`, W, H, page(W, H, build(W, H))])), OUT);
