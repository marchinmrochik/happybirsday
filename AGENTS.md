# Agent Guide

This is the mandatory entry point for any agent working in this repository.

## Project Contract

- The product is a desktop-first interactive birthday mini-game built with Next.js, React, TypeScript, Three.js, GSAP, and local assets.
- User-facing copy is Russian. Source comments and project documentation are English.
- All runtime assets must live under `public/assets/`. Never leave a production dependency in `Downloads`, a temporary directory, or an absolute machine path.
- Do not use Git commands until the user explicitly asks for Git work.
- Preserve the current scene order and interaction contract unless the task explicitly changes them.

## Required Reading Order

1. `README.md` for setup and project status.
2. `docs/ARCHITECTURE.md` for ownership boundaries and runtime data flow.
3. `docs/WORKFLOW_RULES.md` for the required implementation process.
4. `docs/TESTING.md` for baseline and completion checks.
5. The area-specific guide named in the architecture document.
6. The relevant source files. Documentation never replaces source inspection.

## Required Work Cycle

Every implementation task follows this sequence:

1. Restate the requested outcome and identify the affected scene or subsystem.
2. Inspect the current source, related assets, and current visual state.
3. Run the smallest useful pre-change baseline from `docs/TESTING.md`.
4. Ask a short clarification question only when the target, expected behavior, or acceptance criteria remain ambiguous after inspection.
5. Implement the smallest coherent change using existing project patterns.
6. Run the matching post-change checks.
7. Visually verify every changed scene at the relevant viewport. For Three.js work, confirm the canvas is nonblank and the intended asset is visible.
8. Restore the normal initial phase to `scanner` after temporary scene-isolation checks.
9. Update `docs/PROGRESS_LOG.md` with only verified facts.
10. Report what changed, what was verified, and any remaining risk.

## Clarification Boundary

Ask before editing when:

- several objects could match a screenshot description;
- a placement target has no stable id or marked destination;
- the request could change collision, interaction priority, story order, or timing beyond the named element;
- a supplied asset has several formats and the intended runtime source is unclear;
- the requested result conflicts with the existing scene geometry.

Do not ask when the answer is directly available in source, assets, or an unambiguous marked screenshot. For uncertain placement, make one small, reversible adjustment, provide a verification screenshot, and request confirmation before repeated tuning.

## Change Boundaries

- Copy and story data: `src/data/story.ts`.
- Scene orchestration, timers, overlays, and modals: `src/components/BirthdayExperience.tsx`.
- Portal, portal gun, beam, and portal raycasting: `src/components/PortalVerseCanvas.tsx`.
- Garage world, movement, collisions, photos, balls, mirror, and analysis station: `src/components/GarageSceneCanvas.tsx`.
- Shared procedural player geometry and animation: `src/components/playerShell.ts`.
- Customizer preview camera and framing: `src/components/CharacterPreviewCanvas.tsx`.
- Final side-character models: `src/components/CharacterModelsCanvas.tsx`.
- Global visual styling: `app/globals.css`.
- Asset inventory and runtime status: `docs/ASSET_BRIEF.md`.

Do not move logic between these files unless the task genuinely requires a new ownership boundary.

## Verification Standard

- A successful edit is not proof of a working feature.
- TypeScript must pass for source changes: `pnpm typecheck`.
- A production build is required for release work, dependency/configuration changes, and broad shared-runtime changes: `pnpm build`.
- User-facing visual work requires a browser check and screenshot.
- Interaction work requires the complete user gesture, not only direct state injection.
- Keep durable review evidence in `docs/screenshots/`. Temporary iteration captures belong in ignored `artifacts/`.
- Never claim a placement or interaction is correct without current visual or behavioral evidence.

## Completion Checklist

- Requested behavior is implemented.
- Normal start is `scanner`.
- No temporary test hook or forced phase remains unless intentionally documented.
- Relevant type, build, browser, interaction, and responsive checks pass.
- New assets are project-local and documented.
- Documentation is English and links resolve.
- `docs/PROGRESS_LOG.md` records the verified result.

