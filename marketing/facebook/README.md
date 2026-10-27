# SetCue Facebook Page

| File | Size | Use |
| --- | --- | --- |
| `out/profile-icon.png` | 720×720 | Profile picture |
| `out/cover-banner.png` | 1640×624 | Cover photo |
| `out/post-0-introducing-setcue.png` | 1080×1350 | Introduction post with the 15OFF launch offer |
| `out/post-1-save-a-playlist.png` … `out/post-5-covers-and-lyrics-with-ai.png` | 1080×1350 | How-to posts |

Captions and Page setup text are in `posts.md`.

## Re-rendering

```sh
node marketing/facebook/render.js
```

It reuses the styles, logo and desk photo from `../instagram/`. The app screenshots in `source/` were captured from SetCue's browser preview (`npm run preview` in the app repo) with the demo music set loaded, at 3200×2000. In `source/video.jpg` the "music video" playing is a short clip cut from the desk photo.
