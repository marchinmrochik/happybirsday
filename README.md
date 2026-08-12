# Interdimensional 30th Birthday

A desktop-first interactive birthday mini-game. The viewer completes a cinematic sci-fi sequence: scanner diagnostics, a portal-gun shot, dimensional travel, a playable garage laboratory, memory interactions, character customization, a specimen analysis, and a final birthday scene.

## Stack

- Next.js 16 App Router
- React 19 client components
- TypeScript 6
- Three.js with GLTF and FBX loaders
- GSAP timelines
- Web Audio plus a local looping music track
- Global CSS in `app/globals.css`
- Pnpm

## Quick Start

Requirements: Node.js and Pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Fast source validation:

```bash
pnpm typecheck
```

Production validation:

```bash
pnpm build
pnpm start
```

Windows fallback launchers are available as `dev.cmd` and `dev.ps1`. They use the local Node executable when available and can fall back to the Codex bundled Node runtime.

## Agent Entry Point

Read [AGENTS.md](./AGENTS.md) before changing the project. It defines the required inspection, clarification, baseline-test, implementation, visual-verification, and documentation workflow.

Technical documentation:

- [Architecture](./docs/ARCHITECTURE.md): runtime state machine, ownership, data flow, rendering layers, timers, and tuning map.
- [Testing](./docs/TESTING.md): pre-change baseline, post-change matrix, browser smoke test, and evidence rules.
- [Workflow Rules](./docs/WORKFLOW_RULES.md): collaboration, clarification, visual tuning, process recovery, and documentation rules.
- [Garage Scene Guide](./docs/GARAGE_SCENE_GUIDE.md): movement, collision, photos, mirror, player, balls, and station tuning.
- [Asset Brief](./docs/ASSET_BRIEF.md): production assets, source-only assets, fallbacks, and rights review.
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md): completed systems and current backlog.
- [Storyboard](./docs/STORYBOARD.md): current user-visible narrative flow.
- [Progress Log](./docs/PROGRESS_LOG.md): chronological verified implementation history.

## Source Map

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | One-page route entry point. |
| `app/globals.css` | All visual and responsive styling. |
| `src/components/BirthdayExperience.tsx` | Story state machine, overlays, modals, timers, and scene orchestration. |
| `src/components/PortalVerseCanvas.tsx` | Portal, gun, beam, particles, and 3D click targets. |
| `src/components/GarageSceneCanvas.tsx` | Playable garage, camera, collision, photos, mirror, balls, and analysis station. |
| `src/components/playerShell.ts` | Shared procedural character, customization, hair, shoes, and animation. |
| `src/components/CharacterPreviewCanvas.tsx` | Live customizer preview. |
| `src/components/CharacterModelsCanvas.tsx` | Final side-character models. |
| `src/data/story.ts` | Celebrant data and editable narrative content. |
| `src/data/characterCustomization.ts` | Customizer options and defaults. |
| `src/hooks/usePortalAudio.ts` | Procedural interaction effects. |
| `public/assets/` | Every runtime and preserved source asset. |

## Current Interaction Flow

1. The scanner reveals diagnostics, profile data, and the portal CTA.
2. The viewer clicks the 3D portal gun. A beam forms the portal and starts music after the user gesture.
3. The viewer clicks the portal and enters the garage after the travel transition.
4. In the garage, the player moves with `WASD`/arrows, runs with `Shift`, jumps with `Space`, interacts with `E`/`Enter`, and kicks a nearby ball with `F`.
5. Photos open a detail modal. The mirror opens a live character customizer. The chemistry station starts analysis.
6. Analysis reveals the profile HUD and achievements, then waits for the viewer to click the large portal positioned just outside the lower-right edge of the result frame before starting the final dialogue and epilogue.

## Content Editing

Use `src/data/story.ts` for:

- name, age, and birth date;
- scanner copy;
- profile statistics;
- photo ids and image URLs;
- achievements;
- final dialogue;
- final birthday headline and greeting.

Memory images live in `public/assets/memories/`. The analysis portrait lives at `public/assets/analysis/roman-portrait.png`.

## Manual Tuning

Adjust the owning constants instead of adding CSS or DOM overlays around 3D objects:

- portal gun, beam, and portal target: `PORTAL_*_TUNING` in `PortalVerseCanvas.tsx`;
- player floor and furniture collision: `WALKABLE_FLOOR` and `BLOCKED_FLOOR_AREAS` in `GarageSceneCanvas.tsx`;
- garage photos: `PHOTO_LAYOUTS_BY_ID`;
- analysis station: `ANALYSIS_STATION_TUNING`;
- mirror: `MIRROR_STATION_TUNING`;
- player shell, hair, and sneakers: `playerShell.ts`;
- customizer preview framing: `PREVIEW_*` constants in `CharacterPreviewCanvas.tsx`.

Read `docs/GARAGE_SCENE_GUIDE.md` before garage coordinate work.

## Repository Hygiene

Generated dependencies, builds, caches, logs, local environment files, temporary screenshots, and editor state are ignored. Product assets under `public/assets/` and durable verification images under `docs/screenshots/` are intentionally kept in the project.

Do not use Git commands until the user explicitly asks for Git work.

## Deployment Note

Vercel is the intended hosting target. Before public deployment, verify licensing and public-use rights for all third-party models, textures, photos, character references, and music.
