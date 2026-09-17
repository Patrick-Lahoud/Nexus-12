// Central skin registry. A skin is more than a color: each has a base palette
// and (optionally) a unique drawn pattern that renders on the player ball
// in-game and in the locker preview.

export type SkinPattern =
  | 'none'
  | 'hologrid'      // Matrix Hologram: scanning green grid lines
  | 'energy_core'   // Deep Obsidian: glowing inner reactor core
  | 'pulse_rings'   // Omega God: pulsing white ring shockwaves
  | 'star_spangle'  // Snow White: rotating 4-point star sparkle
  | 'molten_cracks' // Inferno Orange: glowing lava cracks
  | 'orbit_dots'    // Gilded Gold: two orbiting satellite dots
  | 'bolt_seam'     // Chrono Glow: lightning seam across the ball
  | 'void_swirl'    // Void Eclipse: violet swirl vortex on onyx
  | 'hemostripes'   // Crimson Death: dark red diagonal combat stripes
  | 'platinum_shine'// Rich Platinum: moving specular shine band
  | 'venom_drips'   // Toxic Green: dripping venom highlights
  | 'frost_rime'    // Frostbite: pale ice crystal spikes
  | 'phantom_mask'  // Phantom Ace: split light/dark phantom face
  | 'particle_leak' // Void Walker: leaking violet particle motes
  | 'crystal_facets'// Amethyst Crystal: refracting facet shards
  | 'live_sparks'   // Overcharged Core: arcing electric sparks
  | 'heat_waves'    // Solar Flare: rising heat shimmer bands
  | 'cyclone_streaks' // Vortex Wind: sheared cyclone streak lines
  | 'voltage_flicker' // Vibrant Cyan: CRT scanline flicker
  | 'thermal_charge'  // Neon Magenta: rising thermal charge bars
  | 'bio_circuit';    // Emerald Green: pulsing bio-circuit traces
export interface SkinDef {
  id: string;
  name: string;
  desc: string;
  color: string;   // base fill
  glow: string;    // outline glow
  stroke?: string; // rim stroke (defaults derived in canvas)
  pattern: SkinPattern;
  patternColor?: string; // accent color for the pattern
}

export const SKINS: SkinDef[] = [
  { id: 'classic', name: 'Classic Cyan', desc: 'The trusty standard neon cyan core.', color: '#06b6d4', glow: '#06b6d4', pattern: 'none' },
  { id: 'vibrant_cyan', name: 'Vibrant Cyan', desc: 'Slightly brighter with hyper-saturated core.', color: '#22d3ee', glow: '#0891b2', pattern: 'voltage_flicker', patternColor: '#ecfeff' },
  { id: 'gilded_gold', name: 'Gilded Gold', desc: 'Polished golden shell with orbiting satellite motes.', color: '#facc15', glow: '#ca8a04', pattern: 'orbit_dots', patternColor: '#fffbeb' },
  { id: 'neon_magenta', name: 'Neon Magenta', desc: 'Ultraviolet pink charging with thermal energy.', color: '#ec4899', glow: '#db2777', pattern: 'thermal_charge', patternColor: '#fbcfe8' },
  { id: 'void_eclipse', name: 'Void Eclipse', desc: 'Onyx core wrapped in a violet event vortex.', color: '#1e1b4b', glow: '#a855f7', pattern: 'void_swirl', patternColor: '#c084fc' },
  { id: 'omega_god', name: 'Omega God', desc: 'Metallic crimson emitting pulsing shockwave rings.', color: '#dc2626', glow: '#ef4444', pattern: 'pulse_rings', patternColor: '#fecaca' },
  { id: 'emerald_green', name: 'Emerald Green', desc: 'Terminal green plating pulsing with bio-energy.', color: '#10b981', glow: '#059669', pattern: 'bio_circuit', patternColor: '#a7f3d0' },
  { id: 'crimson_death', name: 'Crimson Death', desc: 'Cybernetic core with dark combat stripes.', color: '#b91c1c', glow: '#7f1d1d', pattern: 'hemostripes', patternColor: '#7f1d1d' },
  { id: 'matrix_hologram', name: 'Matrix Hologram', desc: 'Pulsing virtual grid simulating digital realms.', color: '#15803d', glow: '#16a34a', pattern: 'hologrid', patternColor: '#86efac' },
  { id: 'snow_white', name: 'Snow White', desc: 'Pure white shell with a rotating star sparkle.', color: '#ffffff', glow: '#f8fafc', pattern: 'star_spangle', patternColor: '#cbd5e1' },
  { id: 'rich_platinum', name: 'Rich Platinum', desc: 'Silver core with a traveling specular shine.', color: '#cbd5e1', glow: '#94a3b8', pattern: 'platinum_shine', patternColor: '#ffffff' },
  { id: 'deep_obsidian', name: 'Deep Obsidian', desc: 'Volcanic stone with a glowing indigo reactor core.', color: '#0f172a', glow: '#6366f1', pattern: 'energy_core', patternColor: '#818cf8' },
  { id: 'inferno_orange', name: 'Inferno Orange', desc: 'Molten lava core with glowing fire cracks.', color: '#f97316', glow: '#ea580c', pattern: 'molten_cracks', patternColor: '#fef08a' },
  { id: 'chrono_glow', name: 'Chrono Glow', desc: 'Chronometer blue crossed by a lightning seam.', color: '#3b82f6', glow: '#1d4ed8', pattern: 'bolt_seam', patternColor: '#bfdbfe' },
  // Former aura rewards, converted to full pattern skins
  { id: 'void_particle', name: 'Void Walker', desc: 'Dark matter skin leaking violet particle motes.', color: '#2e1065', glow: '#a855f7', pattern: 'particle_leak', patternColor: '#a855f7' },
  { id: 'amethyst_crystal', name: 'Amethyst Crystal', desc: 'Crystalline amethyst facets refracting purple light.', color: '#7e22ce', glow: '#c084fc', pattern: 'crystal_facets', patternColor: '#e9d5ff' },
  { id: 'overcharged_sparks', name: 'Overcharged Core', desc: 'Unstable orange core arcing with live sparks.', color: '#c2410c', glow: '#fb923c', pattern: 'live_sparks', patternColor: '#fde047' },
  { id: 'solar_flare', name: 'Solar Flare', desc: 'Corona-bright sun skin radiating heat waves.', color: '#f59e0b', glow: '#fbbf24', pattern: 'heat_waves', patternColor: '#fde68a' },
  { id: 'vortex_trail', name: 'Vortex Wind', desc: 'Storm-grey skin sheared by cyclone streaks.', color: '#4f46e5', glow: '#818cf8', pattern: 'cyclone_streaks', patternColor: '#c7d2fe' },
  { id: 'toxic_green', name: 'Toxic Green', desc: 'Biohazard green dripping venom highlights.', color: '#65a30d', glow: '#84cc16', pattern: 'venom_drips', patternColor: '#bef264' },
  { id: 'frostbite', name: 'Frostbite', desc: 'Pale ice-blue shell rimed with crystal spikes.', color: '#a5f3fc', glow: '#67e8f9', pattern: 'frost_rime', patternColor: '#e0f2fe' },
  { id: 'phantom_ace', name: 'Phantom Split', desc: 'Half-light, half-dark phantom split down the middle.', color: '#ec4899', glow: '#f472b6', pattern: 'phantom_mask', patternColor: '#111827' },
];

export const getSkinById = (id: string): SkinDef | undefined =>
  SKINS.find(s => s.id === id);
