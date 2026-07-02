# 💩 Sewer Surfer

A mobile-first endless runner: flush a turd down the toilet and surf the sewer, Subway-Surfers style. Dodge rats, low pipes and blockages across three lanes, snack on flies for points, and see how far you get before you're flushed out.

Built as an installable PWA with React + Canvas 2D — add it to your home screen for a full-screen, app-like experience.

## Play

- **Swipe left / right** — switch pipes (lanes)
- **Swipe up** — jump
- **Swipe down** — slide
- Keyboard (desktop): arrow keys / WASD, space to jump

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run lint      # oxlint
```

## Tech

- React + TypeScript + Vite
- Canvas 2D rendering with a pseudo-3D trapezoid projection for the tunnel
- Tailwind CSS for the HUD/menu overlays
- `vite-plugin-pwa` for offline support and home-screen installs
- Procedurally drawn sprites and synthesized WebAudio sound effects — no external art or audio assets
