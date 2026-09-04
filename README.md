<div align="center">

# ⚔️ BOUNDLESS BLADE

**A chaotic arcade roguelike where your lethal bouncing blade evolves through rooms of unique enemies — upgrades, abilities, and frictionless destruction.**

</div>

---

## Overview

Boundless Blade is a real-time, physics-driven arena roguelike. You control a single blade-core vessel that is tethered to your cursor and slung around the arena by a kinetic gravity system. Every room throws a new mix of enemies at you; every cleared room offers a choice of upgrades that evolve your weapons from base forms into mutated and god-tier engines.

The game is built entirely for the browser — a fast React + Canvas frontend with no backend and no API keys required.

---

## Game Modes

| Mode | Description |
| :--- | :--- |
| **Survival** | Endless waves with a checkpoint after every sector boss and **3 rebuilds per run**. Die and spend a rebuild to restart right after the last boss with your exact build at full hull. |
| **Hardcore** | The same endless swarm with **zero mercy** — no checkpoints, no rebuilds, no autosaves. One hull, one run. |
| **Sandbox** | Freeform testing with unlimited credits, every weapon and ability available, and instant level control. |

Rooms scale endlessly. Every 10th room is a sector **boss** fight, with an ultra boss awaiting at Room 100.

---

## Core Gameplay

- **Cursor tethering** — your blade is pulled toward the pointer with momentum, letting you sling, deflect, and orbit enemies in real time.
- **Deflection** — knock enemy projectiles and bodies back into the swarm with your blade's momentum.
- **Frictionless destruction** — bouncing ricochets and kinetic impacts chain through packed arenas.
- **Room clear → choose an upgrade** — every clear offers 3–6 options from the live upgrade pool (weapons, abilities, or stat augmentations).
- **Progression economy** — defeated enemies drop credits used in the between-run Shop to buy permanent stat upgrades, deploy defense turrets, and open mining operations.

---

## Controls

| Input | Action |
| :--- | :--- |
| **Mouse** | Move / tether the blade (kinetic pull + sling physics) |
| **Left / Right click** | Trigger equipped tactical skills (Pull, Tether, Teleport, Shockwave, Gravity Well, Stasis Freeze, EMP Pulse) |
| **Space / ability keys (Q, E…)** | Fire equipped active abilities when off cooldown |
| **P** | Open the Tactical Skills shop |

---

## Weapons & Evolution

Every weapon belongs to an evolution family with three tiers: **Base (T1)** → **Mutated (T2)** → **God-Engine (T3)**. Weapons level up as you pick them again; at set levels they mutate into their evolved forms.

| Base (T1) | Mutated (T2) | God-Engine (T3) |
| :--- | :--- | :--- |
| Spinning Blade | Vortex Scythe | Chrono Reaper |
| Auto Turret | Railgun | Omega Beam |
| Fire Trail | Volcanic Plume | Cosmic Flame |
| Orbital Shield | Sentinel Drones | Celestial Guard |
| Energy Burst | Gravity Singularity | Void Singularity |
| Chain Lightning Sword | Thunderbolt Whip | Thunder God |
| Shotgun | Flak Cannon | Obliterator Cannon |
| Homing Blaster | Spell Weaver | — |
| Bomb Launcher | Cluster Bomb | Supernova Bomb |
| Holographic Clone | Holographic Army | Mirage Legion |
| Plasma Razor | Neutrino Shredder | Infinity Razor |
| Tesla Coil | Static Storm | EMP Harvester |
| Gravity Beam | Event Horizon | Singularity Core |
| Ion Cannon | Orbital Strike | Death Star Beam |
| Mine Layer | Sensor Cluster | Void Mines |
| Photon Repeater | Lance Array | Hyper-Light Array |
| Ricochet Cannon | Refraction Lance | Echo Strike |
| Ice Sword | Glacial Greatsword | Absolute Zero Siphon |
| Fire Sword | Solar Eclipse Blade | Supernova Slayer |

---

## Active Abilities

Keybound abilities with cooldowns that mutate into stronger forms at higher levels:

| Ability | Mutation |
| :--- | :--- |
| Shockwave Blast | Seismic Crusher |
| Toxic Cloud | Corrosive Decay |
| Shield Nova | Plasma Nova |
| Overdrive Dash | Dimensional Dash |
| Temporal Shift | Temporal Collapse |
| Combat Overdrive | Apex Overdrive |
| Volt Cascade | Thunderbolt Storm |
| Glacier Pulse | Absolute Zero Ripple |
| Repair Nanites | Nanite Aegis |
| Orbital Strike | Supernova Rain |
| Berserker Engine | Sanguine Frenzy |
| Bouncing Rounds | Kinetic Bounce Storm |
| Glacial Blizzard | Frostbite Tempest |
| Inferno Flames | Hellfire Storm |

Global burst abilities (Shield Nova, Shockwave, Meteor Strike, Volt Cascade, Inferno and their evolutions) deal crowd-control damage capped at **35% of an enemy's max HP per hit** — they never one-shot, they clear space.

---

## Tactical Skills

Unlockable mouse abilities bought from the Skills shop (2500 Cr or free in Sandbox). Equip one per click slot:

- **Redirection Pull** — yank enemies toward you
- **Gravity Tether** — tether and swing around enemies
- **Gravity Warp** — teleport
- **Shockwave Blast** — knock everything back
- **Gravity Well** — drag the swarm into a vortex
- **Stasis Freeze** — lock enemies in place
- **EMP Pulse** — disable gunners and projectiles

---

## Stat Augmentations

Stat upgrades appear in upgrade picks and the Shop, and also evolve through three-tier chains (e.g. Hull Plating → Heavy Alloy Plating → Adamantine Core):

- **Hull** — Max HP, Defense, Regen, Lifesteal
- **Mobility** — Velocity, Melee Speed, Weapon Size
- **Offense** — Fire Rate, Crit Chance, Critical Bonus, Impact, Pierce, Accuracy
- **Synergy** — System Synergy, Enemy Slow, Fire Damage +, Slow Damage +, Upgrade Choices

---

## Economy, Shop & Deployments

- **Credits** are earned in runs and spent in the Shop between runs.
- **Stat purchases** — permanent, scaling-cost augmentations.
- **Defense Sentry Turrets** — deployable auto-turrets that fight alongside you.
- **Automated Mining Drills** — passive credit generators that pay for themselves over time.
- **Tactical Skills shop** (P) — unlock the mouse abilities above.

---

## The Arena & Bestiary

The handbook catalogs every threat by sector. Enemies escalate in behavior — chasers, gunners, splitters, shielded drones, healers, bombers, phase-shifters, leech tethers, and void predators:

| Sector | Theme | Threats | Boss |
| :--- | :--- | :--- | :--- |
| 1–10 | Crimson Alpha | Runner, Shooter, Splitter, Tank | **Warrior** |
| 11–20 | Frozen Caverns | Force Field Chaser, Tesla Coil, Healer | **Titan** |
| 21–30 | Magnetic Ruins | Gunner, Mirage, Bomber, Gravity Drain | **Phantom Ace** |
| 31–40 | Ionized Clouds | Swarmer, Warp Warlock, Plasma Stormer, Bio Leech, Cryomancer, Phantom, Stalker | **Storm Bringer** |
| 41+ | The Void Abyss | Void Marauder | **Void Sentinel** |

Deep runs (Room 30+) also rotate in the sovereigns **Architect**, **Swarm Queen**, and **Reaper**, and introduce shielded elites with spawn immunity, periodic phase barriers, directional shields, and rotating weak-point gaps.

---

## Locker, Skins & Achievements

- **Locker** — equip cosmetic blade-core skins and energy-trail auras.
- 14 skins (Classic Cyan, Vibrant Cyan, Gilded Gold, Neon Magenta, Void Eclipse, Omega God, Emerald Green, Crimson Death, Matrix Hologram, Snow White, Rich Platinum, Deep Obsidian, Inferno Orange, Chrono Glow) and 6 auras (Void Particle, Amethyst, Overcharged Sparks, Solar Flare, Vortex Wind).
- Cosmetic unlocks are earned by **achievements** — milestone runs, boss kills, no-damage clears, and weapon-combo feats. Locked items show the exact achievement required.

---

## Localization

Fully localized in **11 languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, and Indonesian (switchable from the title screen).

---

## Tech Stack

- **React 19 + TypeScript** — UI and state
- **Vite 6** — build tooling
- **Canvas 2D** — real-time game rendering (custom engine loop, particles, neon FX)
- **Tailwind CSS v4** — UI styling
- **Framer Motion (motion/react)** — animations and transitions
- **lucide-react** — icons

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Typecheck
npm run lint
```

No environment variables or API keys are required — the game is fully self-contained.

---

## AI Playtesting & Balance Bot

The repo ships a headless playtest harness (`tools/playtest/`) that drives the **real game engine** in Node at hundreds of times realtime:

- **Three player policies** (aggressive, defensive, glass-cannon) with human-like reaction delays and dodge heuristics.
- **Difficulty calibration** — batch audits every 10 attempts against target benchmarks (rooms 40 / boss 50 / 70 / boss 100) within a 5% tolerance band.
- **Micro-tuning engine** — capped ±2% stat tweaks with snapshot rollback on regression, alternating enemy HP/damage knobs (defaults are 1.0, so shipped gameplay is unchanged).
- **Mechanic validation** — full 100-room campaign runs to catch crashes and state desyncs.

```bash
npm run playtest              # 20-run dry audit
npm run playtest -- --runs=100 --tune --batch=10
```

See `tools/playtest/README.md` for full documentation.

---

## Project Structure

```
src/
  game/          # Engine, upgrades, abilities, achievements, balance, localization
  components/    # Canvas renderer, HUD, shop, compendium, locker, handbook, modals
  hooks/         # Game loop hooks
tools/playtest/  # Headless AI playtesting & balance bot
```

---

<div align="center">

**Boundless Blade** — survive the swarm, evolve your arsenal, and chase the Room 100 ultra boss.

</div>