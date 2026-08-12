# Testing And Verification

This project uses a tests-before-implementation baseline and a matching post-change verification pass. The goal is to distinguish a new regression from behavior that already existed before the edit.

## Commands

Install dependencies once:

```bash
pnpm install
```

Start the normal desktop preview:

```bash
pnpm dev
```

Run the fast source check:

```bash
pnpm typecheck
```

Run the production check:

```bash
pnpm build
```

The normal preview URL is `http://localhost:3000`.

## Pre-Change Baseline

Before implementation:

1. Read the task and identify its owning files from `docs/ARCHITECTURE.md`.
2. Run `pnpm typecheck` for any source, configuration, or dependency task.
3. For a visual task, open the exact current scene and capture or inspect the before state.
4. For an interaction task, reproduce the complete current gesture and note the actual behavior.
5. For an asset task, confirm the file exists inside `public/assets/`, loads successfully, and has visible nonblank output.
6. Record unrelated pre-existing failures instead of silently attributing them to the new work.

Documentation-only changes do not require starting the application when current runtime behavior is not being claimed.

## Post-Change Matrix

| Change type | Required checks |
| --- | --- |
| Markdown or comments only | Review links, paths, commands, English language, and consistency with current source. |
| Copy/data only | `pnpm typecheck`; open every scene that renders the changed data. |
| CSS/layout | `pnpm typecheck`; target viewport screenshot; overflow/overlap check. |
| React state/timing | `pnpm typecheck`; run the complete phase transition; verify timers and cleanup. |
| Three.js placement/material | `pnpm typecheck`; screenshot; canvas nonblank check; raycast/interactivity check when relevant. |
| Movement/collision | `pnpm typecheck`; walk every changed boundary and interaction approach path. |
| Asset replacement | `pnpm typecheck`; network/load check; visual bounds, orientation, materials, and fallback behavior. |
| Configuration/dependencies/shared runtime | `pnpm typecheck`; `pnpm build`; targeted browser regression pass. |
| Release candidate | `pnpm typecheck`; `pnpm build`; full desktop story smoke test; rights and asset-path review. |

## Browser Smoke Test

Use a desktop viewport close to `1280x720` unless the task specifies another target.

1. Hard-refresh the page.
2. Confirm the scanner is the initial scene.
3. Wait for diagnostic rows and the profile card.
4. Click the scanner CTA.
5. Click the visible 3D portal gun, confirm the beam, wait for the portal and music, then click the portal.
6. Confirm the travel transition reaches the garage.
7. Move the player with `WASD`, rotate the view, and confirm furniture collision.
8. Rotate the chase camera beside walls and large props; confirm the camera stays inside the room and hidden photo backs do not render through geometry.
9. Approach one photo, confirm single-object focus, open it with `E`, and close the modal.
10. Approach the mirror, open the customizer, change an option, and confirm both the live preview and garage player update.
11. Pick up a ball with `E`, turn the character in both directions, and confirm the ball stays at the same hand/body offset instead of moving behind the player.
12. Throw the carried ball with `E`, confirm it detaches cleanly into the room, then kick a floor ball with `F`.
13. Put the floor mirror between the camera and the analysis station and confirm the `START` label does not render through the mirror.
14. Approach the analysis station and start it with `E`.
15. Confirm the analysis portrait, statistics, achievements, and completion banner are visible and readable.
16. Wait beyond the former automatic transition time and confirm the analysis HUD remains visible.
17. Click the small lower-right result portal and confirm the final dialogue appears with the two side characters outside the modal.
18. Confirm the epilogue hierarchy, exact greeting, final character, and speech bubble.

## Visual Assertions

For every affected scene verify:

- no text or control overlaps another UI element;
- no important text is clipped at the viewport edge;
- fixed-format cards and canvases do not shift when content appears;
- the intended 3D asset is visible, correctly oriented, and not transparent by accident;
- no duplicate body part, hair part, shoe, or model overlay appears;
- the active interaction is visually unambiguous;
- the canvas contains meaningful non-background pixels;
- browser console and network panel contain no new errors for the changed asset or code path.

Use `docs/screenshots/` for final review evidence named by scene and purpose. Use ignored `artifacts/` for temporary iterations.

## Temporary Scene Isolation

For a long automatic sequence, an agent may temporarily set the initial `phase` in `BirthdayExperience.tsx` to the target scene for local verification.

Rules:

1. state clearly that the override is temporary;
2. do not use it as the only interaction test;
3. restore `useState<GamePhase>("scanner")` before completion;
4. run a final localhost check after restoration.

## Build And Dev Server

Next dev mode uses `/_next/webpack-hmr`; that WebSocket is expected.

Do not start duplicate servers. Check `http://localhost:3000` first. If `pnpm build` needs exclusive access to `.next`, stop only the known project dev process, run the build, and restart the preview. Never kill an unidentified process.

## Completion Evidence

A completion report must state:

- the changed files or subsystem;
- the exact checks that passed;
- the viewport used for visual verification;
- where the screenshot was saved, when visual work was performed;
- any check that was not run and why.
