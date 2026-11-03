# SetCue feature graphic

"Everything SetCue does": the app screenshot plus every feature in four groups (Mix like a DJ, Put on a show, Plug in your gear, Your music).

| File | Size | Use |
| --- | --- | --- |
| `out/setcue-features-1080x1350.png` | 1080×1350 | Facebook / Instagram feed |
| `out/setcue-features-1920x1080.png` | 1920×1080 | Website, Gumroad, YouTube |

Features tagged WINDOWS are in the Windows version now and coming to Mac and Linux. Edit `GROUPS` in `render.js` as features ship, then:

```sh
node marketing/features/render.js
```

## Animated version

- `out/setcue-features.gif`: 540×675, loops, 5.3 s (eight beats). For websites, email, Gumroad and anywhere that plays GIFs.
- `out/setcue-features.mp4`: 1080×1350 with the song. For Facebook and Instagram, which play MP4s better than GIFs.

The top window's visualizer plays Neon Gateway (Ultraviolet palette) to "Outrunning Ghosts" from the demo pack, with its timed lyrics, and the window's glow pulses on each bass hit. Run `render.js` first, then:

```sh
node marketing/features/animate.js <SetCue app repo> "<Outrunning Ghosts.mp3>" "<Outrunning Ghosts.lrc>"
```
