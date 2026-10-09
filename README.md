<div align="center">

# ⚡ NEXUS 12

**Physics-driven arena roguelike in the browser. Tether your blade, sling through swarms, evolve your build every room.**

Play it live: **[nexus12.surge.sh](https://nexus12.surge.sh)**
</div>

---

## Modes
| Mode | What it is |
| :--- | :--- |
| **Survival** | Endless rooms, boss fights every 10 stages, 3 rebuilds per run as checkpoints |
| **Hardcore** | Same run, one life — no checkpoints, no rebuilds, no autosave |
| **Sandbox** | Everything unlocked, unlimited credits, instant room selection for testing |

## Controls
| Input | Action |
| :--- | :--- |
| **Mouse / tether** | Steering — the blade is pulled toward your cursor with kinetic physics |
| **Left / right click** | Equipped tactical skills (Pull, Teleport, Shockwave, Gravity Well, Stasis, EMP) |
| **Space / Q / E** | Active abilities on cooldown |
| **Touch** | Full mobile support — analog joystick, fire button, ability buttons |

## Build Pipeline
| Build | Command | Purpose |
| :--- | :--- | :--- |
| Standard web release | `npm run build` | Output zipped into `nexus12-web.zip` (itch.io / surge) |
| CrazyGames submission | `npm run build:crazygames` | Injects CrazyGames SDK v3 + GameplayStart/Stop events; output zipped into `nexus12-crazygames.zip` |
| Coolmath submission | `npm run build:coolmath` | SDK compiled out, external fonts stripped, plain-text credits for school network compliance; output zipped into `nexus12-coolmath.zip` |
| Deploy to live URL | `npm run deploy:surge` | Builds standard + publishes to [nexus12.surge.sh](https://nexus12.surge.sh) |

Zip every build with `python tools/make_zip.py <output-name.zip>`, which writes proper forward-slash zip root entries with assets alongside.

## Tech
- React 19 + TypeScript + Vite, Canvas 2D physics engine, Tailwind 4
- Fixed low-memory 800×500 render backing, adaptive frame-skipping, memoized gradients
- 11-language localization, procedural audio engine (no audio files)
- Save/progress via localStorage; CrazyGames cloud saves when playing there

## Dev setup
```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit across all three build targets
```
