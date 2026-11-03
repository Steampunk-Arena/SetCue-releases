# SetCue Reddit thumbnails

Three concepts, each in three sizes (`out/reddit-<concept>-<size>.png`):

| Concept | Text | Background |
| --- | --- | --- |
| `built-it` | I built my own DJ app. No subscription. Plays your files. | The SetCue app |
| `light-show` | Your music. A light show. | Neon Gateway visualizer |
| `one-screen` | Every monitor. One picture. | Monitor wall with the visualizer spanned (`source/monitor-wall.png`) |

| Size | Use |
| --- | --- |
| 1080×1080 | Image posts, feed |
| 1200×628 | Link previews (og:image) and Reddit ads |
| 400×300 | Reddit ad thumbnails |

Reddit shows thumbnails at about 140 px, so each keeps to a few large words.

```sh
node marketing/reddit/render.js
```
