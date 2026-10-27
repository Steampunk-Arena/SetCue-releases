# SetCue Gumroad page

- `listing.md` — copy for every field of the Gumroad product editor.
- `out/cover-*.png` (1280×720) — cover images, in display order.
- `out/thumbnail.png` (600×600) — square thumbnail.

Re-render after editing `render.js`:

```sh
node marketing/gumroad/render.js
```

It reuses the styles, logo and source images from `../instagram/`.
