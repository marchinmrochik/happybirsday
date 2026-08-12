# Workflow Rules

## Core Rule

The working loop is:

`understand -> inspect -> baseline test -> clarify if needed -> implement -> verify -> document`

Implementation must not begin from the request text alone when the answer can be checked in the repository or current UI.

## Task Intake

1. Restate the requested outcome in concrete terms.
2. Identify the owning subsystem from `docs/ARCHITECTURE.md`.
3. Read the current implementation and the relevant area-specific guide.
4. Inspect supplied assets or screenshots before choosing coordinates, formats, or integration behavior.
5. Define the smallest acceptance check that proves the requested result.

## Baseline Before Implementation

- Run the smallest relevant check before editing so pre-existing failures are known.
- Use `pnpm typecheck` for source, configuration, and dependency work.
- Reproduce the current UI state before visual or interaction changes.
- For long scene sequences, document the current scene and timing before modifying it.
- Do not start a duplicate dev server when `http://localhost:3000` already responds.

See `docs/TESTING.md` for the complete matrix.

## When To Ask Questions

Ask one short, specific question when source inspection still leaves an implementation-critical ambiguity:

- multiple objects match the description;
- a screenshot target is not marked clearly;
- the requested move could affect collision or another interaction;
- several supplied asset files could be the production source;
- the desired layout hierarchy or exact copy is incomplete;
- the request conflicts with the current scene geometry.

Do not ask the user to answer a fact already visible in source or supplied files. If an uncertain placement is low risk, make one small adjustment, provide a screenshot, and ask for confirmation before another iteration.

## Implementation

- Follow current project patterns and ownership boundaries.
- Keep story text in `src/data/story.ts`, world coordinates in their Three.js component, and visual presentation in `app/globals.css`.
- Avoid broad refactors during narrow screenshot-driven work.
- Copy every active asset into `public/assets/` before wiring it into source.
- Use stable ids such as `memory-05`; do not rely on visual order or phrases such as "the middle photo".
- Keep source comments short and English. Add comments only for non-obvious coordinate systems, rendering order, or cleanup invariants.

## Visual Tuning

1. Read the current tuning constant and object id.
2. State the inferred object and target in the work update.
3. Change one axis or one tightly related transform group at a time when direction is uncertain.
4. Capture a current browser screenshot after the first meaningful adjustment.
5. Compare against the supplied reference and check nearby interactions.
6. Ask for clarification instead of repeating blind coordinate guesses.
7. Keep final evidence in `docs/screenshots/`; temporary iteration images belong in ignored `artifacts/`.

For garage work, follow `docs/GARAGE_SCENE_GUIDE.md`.

## Verification

- Run `pnpm typecheck` after source changes.
- Run `pnpm build` for release work, dependencies/configuration, or broad runtime changes.
- Exercise the actual interaction path after interaction work.
- Visually inspect affected desktop scenes and any explicitly requested mobile view.
- Confirm Three.js canvases are nonblank and required assets loaded.
- Check for text overlap, clipping, duplicate geometry, wrong material opacity, and stale forced test phases.
- Restore the initial phase to `scanner` after isolated scene testing.

## Reporting

Update `docs/PROGRESS_LOG.md` after meaningful implementation work. Record:

- what changed;
- which files or subsystem changed;
- what was actually verified;
- screenshot paths when visual work was verified;
- any test not run and the reason.

Do not claim a visual placement, build, or interaction works without current evidence.

## Stuck Process Rule

If a process is slow or appears stuck:

1. inspect the current terminal output, port, process, log, and output artifact;
2. do not repeat the same command blindly;
3. continue from valid produced evidence when possible;
4. use a safer or more focused alternative when the expected result is missing;
5. record a genuine deferred verification in `docs/PROGRESS_LOG.md`;
6. kill a process only after confirming it belongs to this project and is no longer needed.

## Local And LAN Preview

- Desktop preview: `pnpm dev`, then `http://localhost:3000`.
- LAN preview: `pnpm dev:lan`, then use the computer's private IPv4 address on the same Wi-Fi.
- Next dev mode uses `/_next/webpack-hmr`; the WebSocket is expected and not application gameplay logic.
- Verify HTTP availability before sharing any URL.
- A phone cannot open the computer's `localhost`; Windows Firewall may need to allow Node.js on the private network.

## Git

- Do not run Git commands until explicit approval is given.
- Treat the current directory as a normal working folder.
- Never discard or overwrite unrelated user changes.

## Documentation

- Documentation and code comments are English.
- Literal Russian UI copy may appear in backticks when documenting exact product text.
- Update technical documents when architecture, controls, active assets, commands, or verification requirements change.
- Keep `PROGRESS_LOG.md` chronological; do not turn it into the primary onboarding document.

