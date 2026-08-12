# Implementation Plan

This document tracks system-level completion and remaining work. Current behavior is documented in `docs/ARCHITECTURE.md`; chronological detail is in `docs/PROGRESS_LOG.md`.

## 1. Project Foundation

Status: complete.

- Next.js App Router, React, and TypeScript.
- One client-side story state machine.
- Three.js and GSAP integration.
- Project-local assets under `public/assets/`.
- Pnpm dev, typecheck, build, and start commands.
- Agent workflow, architecture, testing, garage, asset, and progress documentation.

## 2. Scanner

Status: complete.

- Timed diagnostic log with one error row and a longer correction pause.
- Delayed profile reveal synchronized with the final diagnostic row.
- Celebrant profile and portal CTA.
- Desktop panel styling and responsive fallback.

## 3. Portal And Travel

Status: complete.

- Imported 3D portal and portal gun.
- Three.js raycast click on the gun.
- Animated 3D beam and delayed portal-ready state.
- Music start after a user gesture.
- Portal raycast click to enter a short travel phase.

## 4. Playable Garage

Status: complete, open for visual tuning.

- Imported garage FBX plus dependable room shell.
- Third-person player and horizontal chase-camera look.
- Walk, run, jump, collision, and recovery from invalid positions.
- Eight project-local memory photos with modal viewing and single-object focus.
- Chemistry analysis station.
- Mirror customizer with live preview.
- Procedural football and basketball interactions.
- Shared procedural player shell with customization, face states, hair, and high-top sneakers.

Coordinate and collision changes must follow `docs/GARAGE_SCENE_GUIDE.md`.

## 5. Analysis HUD

Status: complete.

- Profile header and celebrant data.
- Project-local Roman portrait with top-aligned crop.
- Achievement cards and completion banner.
- GSAP reveal sequence.
- Automatic transition after an extended reading interval.

## 6. Final Dialogue And Epilogue

Status: complete.

- Final portal visual and two local side-character models.
- Structured dialogue with speaker sections, emphasis, checklist, level-up, and wishes.
- Desktop-centered dialogue panel with side characters outside it.
- Timed transition to the epilogue.
- Two-level epilogue headline, exact greeting, loaded-season status, and transparent final character with speech bubble.

## 7. Verification And Repository Hygiene

Status: complete for the current implementation.

- Standard Next.js/Node/editor/log/cache/environment ignore rules.
- `pnpm typecheck` fast validation command.
- Production build command.
- Required browser smoke-test and screenshot workflow.
- Durable evidence location under `docs/screenshots/`.

## 8. Remaining Release Work

- Complete a full desktop story smoke test after all content is final.
- Review all third-party asset and music rights before public deployment.
- Optimize large PNG/FBX/GLB assets if network loading becomes a release concern.
- Add a production Open Graph image if the site will be shared publicly.
- Confirm the final Vercel deployment and public URL.
- Add automated Playwright coverage if the project moves beyond one-off delivery or receives continued feature work.

## Optional Future Work

- Add more memory photos through stable `memory-*` ids.
- Replace procedural clothing or sports props only with browser-ready, correctly licensed, visually verified assets.
- Refine the source character mesh/rig instead of adding overlapping runtime geometry.
- Add accessibility options for reduced motion and audio control if broader distribution is planned.

