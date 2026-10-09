# Nexus 12 (formerly Boundless Blade) — release builds

## Build targets

| Zip                        | Command                    | Platform SDK      | External requests        |
|----------------------------|----------------------------|-------------------|--------------------------|
| `nexus12-web.zip`          | `npm run build`            | none              | Google Fonts CDN only    |
| `nexus12-crazygames.zip`   | `npm run build:crazygames` | CrazyGames SDK v3 | + sdk.crazygames.com     |
| `nexus12-coolmath.zip`     | `npm run build:coolmath`   | none (compiled out) | **zero third-party**   |

Always build first, then package with:

```bash
python tools/make_zip.py <zip-name>.zip
```

(Do NOT use PowerShell `Compress-Archive` — it writes backslash zip entry names
that Linux-based extractors mis-read. The Python script writes forward slashes
and puts `index.html` at the zip ROOT, which every portal expects.)

`vite build` wipes `dist/` each run: build one target, zip it, then build the next.

## How to upload to itch.io

1. Go to https://itch.io/game/new and create a new project.
2. In "Kind of project", choose **HTML** (itch.io calls these "downloadable or browser playable" -> HTML).
3. Upload `nexus12-web.zip` as the game file. Do NOT upload the loose dist/ folder; itch expects a zip with index.html at its root (this zip has that).
4. Check the box "This file will be played in the browser".
5. In Embed options:
   - Viewport: 1280x720 or 16:9 fit-to-page. The game is responsive and fills any viewport.
   - Frame size: any. Mobile-friendly checkbox is optional (game has full touch controls).
6. Save & view page. The game runs fully client-side; no server needed.

## Notes

- The CrazyGames SDK is host-gated: on itch.io it stays dormant and all saves fall back
  to browser localStorage automatically. Nothing breaks. In `build:coolmath` it is
  compiled out entirely.
- Save data (highest room, unlocks, equipped skin, resume save) persists per-browser
  via localStorage. No accounts, no external data collection.
- The Coolmath build (school-safe): no ads SDK, no tracking, no external font CDN,
  no clickable external links — plain-text studio credit on the title screen only.
