# SetCue Instagram set

Generated from `source/desk-setup.png`.

| File | Size | Use |
| --- | --- | --- |
| `out/feed-hero.png` | 1080×1350 | Single feed post |
| `out/story.png` | 1080×1920 | Story / Reel cover |
| `out/carousel-01-cover.png` … `out/carousel-07-cta.png` | 1080×1350 | Feature carousel |

Captions, hashtags and alt text are in `captions.md`.

## Re-rendering

Edit the copy or crops in `render.js`, then run:

```sh
node marketing/instagram/render.js
```

Needs Node with Playwright and the Inter / JetBrains Mono fonts installed.

The feature slides zoom into the monitor in the photo, so their UI detail is soft. To sharpen them, swap the `crop` rects for real app screenshots.
