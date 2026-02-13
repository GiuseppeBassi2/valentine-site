# Valentine Single-Page Site (mobile-first)

A cute, interactive Valentine site built as a **single-page app with vanilla HTML/CSS/JS** (no frameworks, no build step).  
Designed to run both by opening `index.html` locally **and** on GitHub Pages.

## Folder structure

```
valentine-site/
  index.html
  css/styles.css
  js/app.js
  js/config.js
  assets/
    (your photos + gifs)
```

## Customize

### 1) Photos / assets
Replace filenames inside `assets/` (keep the same names or update `js/config.js`):

- `INNAMORATO.JPG`
- `FIRST_DATE.JPG`
- `MUSEUM_MIN.jpg`
- `PAPERA_MIN.jpg`
- `CUTE_MIN.JPG`
- `CUTE_MINNIE.PNG`
- `MINNIE_TOGETHER.jpg`
- `CHICAGO.jpg`
- `HEART_MIN_1.jpg`
- `bear_jump.gif` (jumping bear gif)
- `chocolates.png` (bonbon/chocolate image)

> Tip: use `.jpg`/`.png`/`.webp` for web compatibility.

### 2) Text / colors
Edit `js/config.js`:
- `pageTitle`
- `palette`
- `floating.emojis`
- `loveMeter.thresholds`
- `photos.*.caption`

### 3) “ASSE_GIAPPONE” quote
In `index.html`, find the Min vs Minnie slide text and replace:
`(Insert your “ASSE_GIAPPONE” quote here.)`

## Deploy on GitHub Pages
1. Push this folder to a GitHub repo.
2. GitHub → **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` / folder: `/ (root)`

## Mobile test checklist (quick)
- iOS Safari: open link, check buttons are tappable (min 44px), no weird scroll.
- Android Chrome: same + check images fit screen.
- Try the “No” runaway button on touch.
- Try sliding past 100% on the love meter.
- Tap reveal on “good boy” slide.
- Replay button works.
- Enable “Reduce Motion” and confirm floating emojis stop.
