# SetCue Instagram set

Hero images use `source/desk-setup.png`; feature close-ups use `source/app-screenshot.png`; the logo comes from `source/setcue-icon.svg`.

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

Feature-slide crops are pixel rects in `source/app-screenshot.png` (1912×1011); update them if you replace the screenshot.
