# Progress Log

This log is written in English so future agents can quickly understand the current state and the decisions already made.

## Initial Build Direction

- The project started as a one-page cinematic birthday mini-site.
- The stack is Next.js, TypeScript, Three.js, GSAP, and plain CSS.
- The design direction is a chaotic animated sci-fi birthday adventure, not a business-card website.
- Constraint: do not use Git until explicit approval is given.

## Asset Migration

- Active assets were copied into the project under `public/assets/`.
- Portal, portal gun, garage, final character models, and music now live inside the project.
- This avoids broken deploys caused by references to `Downloads` or temporary local paths.

## Portal Iterations

- The old static portal image was replaced with the 3D portal asset.
- Portal normalization was corrected so the asset scales by its real X/Z surface instead of its thin depth axis.
- Large floating transition blobs were removed from the travel scene.
- The portal gun model was recolored to match the downloaded reference more closely.
- The portal gun was repeatedly rotated and moved based on screenshots so its handle and muzzle direction looked closer to the expected pose.

## Garage Iterations

- The flat garage image was removed as the active scene.
- The garage FBX asset is now rendered as an inside-camera 360 WebGL scene.
- The viewer can rotate horizontally with mouse/touch and stay in one central room position.
- Vertical look movement was removed to preserve room framing.
- Generated 3D photo placeholders were placed inside the garage.
- Clicking a 3D photo opens a modal.

## Analysis Station Iterations

- The chemistry station started as a screen overlay and was moved into the WebGL garage scene.
- Multiple screenshot-guided attempts moved the station toward the target workbench.
- Some previous coordinates pushed the station too far left, too deep, or behind the garage model.
- The latest implementation centralizes station tuning in `ANALYSIS_STATION_TUNING`.
- Current target: the long workbench under the paper board, near the empty tabletop area shown in screenshots.

## Scanner CTA Fix

- The scanner CTA previously depended on `scannerReady`.
- The CTA can now be clicked even if animation timing does not set readiness quickly enough.
- CSS keeps the CTA above visual layers and touch-friendly.

## Portal Gun Click And Beam Update

- Removed the old invisible HTML gun button from the portal scene.
- Removed the old CSS beam overlay from the portal scene.
- `PortalVerseCanvas` now uses `THREE.Raycaster` to detect clicks on the 3D portal gun.
- After the gun is clicked, a 3D beam cylinder grows from the barrel area to the portal center.
- After the portal is ready, the viewer clicks the 3D portal target to enter the travel scene.
- Main tuning blocks:
  - `PORTAL_GUN_TUNING`
  - `PORTAL_BEAM_TUNING`
  - `PORTAL_CLICK_TUNING`
  - `ANALYSIS_STATION_TUNING`

## Local Preview Notes

- Development mode may show a WebSocket request to `/_next/webpack-hmr`; that is Next.js hot reload, not app logic.
- Production preview does not include that HMR WebSocket.
- Current preview target: local desktop preview, not Wi-Fi phone preview.

## Latest Verification

- Build command used successfully through bundled Node:

```bash
C:\Users\roman\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build
```

- Result: Next.js production build completed successfully.

## Latest Change Summary

- Portal scene click flow now uses real 3D click targets.
- Portal beam is now aligned in Three.js, not CSS.
- Analysis station coordinates were moved into a clear tuning constant.
- All Markdown documentation was rewritten in English.

## Portal Debug Removed

- Removed the temporary `window.__portalDebug` hook.
- Restored the normal portal flow: one gun shot opens the portal, then the portal click starts travel.
- Raised the 3D beam path by increasing the Y values in `PORTAL_BEAM_TUNING`.

## Lab Vignette Removed

- Removed the dark gradient and inset shadow from `.lab-image-vignette` so the WebGL garage renders brighter.

## Analysis Station Coordinates Locked

- Locked the live-tested chemistry station transform in `ANALYSIS_STATION_TUNING`.
- Current transform: `position: [-3.5, 0.9, 0.8]`, `rotation.y: 1.6`, `scale: 0.85`.

## First Memory Photo Batch

- Copied the first 8 memory images into `public/assets/memories/`.
- `decorativePhotos` now points to real image files instead of generated placeholders.
- The WebGL garage photo panels now render real photo textures inside polaroid-style cards.
- Garage photo placement is now data-driven: new memories reuse the existing wall and door layout slots with a small offset.
- Photo panels render above the transparent garage shell so images remain readable instead of disappearing behind the model.
- Verified locally: scanner-to-portal-to-lab flow works, front and side garage photos are visible, and clicking a 3D photo opens the real image in the modal.

## Playable Garage Character

- Copied the generated cartoon runner model into `public/assets/models/cartoon-runner-v2.glb`.
- The garage scene now loads the GLB with `GLTFLoader` and plays `Idle`, `Walk`, and `Run` animations.
- Desktop controls: `WASD` / arrow keys move the character, `Shift` runs, mouse drag turns the camera.
- Touch controls: dragging the lower half of the canvas moves the character; dragging the upper half turns the camera.
- Movement is limited by `WALKABLE_FLOOR`, a polygon that approximates the open floor area and keeps the player away from benches, cabinets, and walls.
- Nearby memory photos glow and scale up within `PHOTO_INTERACTION_RADIUS`; the existing click-to-open modal behavior is preserved.
- The model is styled at runtime toward the requested direction: white shirt, black shorts, stronger bun, smaller side hair, and adjusted face/head proportions.

## Playable Character Visibility Fix

- Added a world-space visible player shell so the garage always shows a character even if the supplied GLB has unusual internal origin, material, or scale data.
- Kept the supplied GLB loaded as a separate pivoted model and synced it to the playable shell.
- Fixed GLB normalization by centering the model on X/Z and grounding it on the floor inside a pivot group instead of overwriting the normalization transform.
- Moved the player start position to open floor space and added extra blocked floor areas for the front table and workbench zones.
- Desktop mouse drag in the lower half of the garage canvas now also acts as movement input, making local desktop testing easier.
- Verified the scanner-to-portal-to-lab flow in the browser and visually confirmed the player appears on the garage floor.
- Latest build verification passed with:

```bash
C:\Users\roman\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build
```

## Opaque Player And Wall Access

- Changed player shell and runtime-styled GLB materials to explicit opaque materials with depth writing enabled.
- Raised player render order so transparent garage shell layers no longer visually wash through the character.
- Expanded `WALKABLE_FLOOR` toward the right wall and rear wall photo zones.
- Kept furniture collision rectangles in `BLOCKED_FLOOR_AREAS`, so the extra access is toward the wall/photos rather than through shelves or tables.
- Verified in-browser that the player now renders as a solid character on the garage floor.

## Player Duplicate Limb And Access Update

- Hid the loaded GLB pivot from rendering so it no longer overlaps the visible playable shell during movement.
- Kept the GLB loaded as a hidden source asset, but the world-space shell is now the only visible playable body.
- Shifted the left-wall memory photo near the analysis station higher and farther forward so it does not compete visually with the `START` chemistry trigger.
- Expanded `WALKABLE_FLOOR` farther toward the right and rear wall photo areas.
- Adjusted blocked furniture rectangles so the player has more wall access while still being kept out of benches, tables, and shelves.
- Verified with a successful Next.js production build.

## Player Layer, Floor Polygon, And Face States

- Added `PLAYER_RENDER_ORDER` and moved the visible player shell into a high render layer.
- Player materials now render in the transparent queue with `opacity: 1`, so memory photos no longer draw above the character.
- Recalculated the walkable garage polygon as a wider room-shaped floor area and kept separate blocked rectangles for major furniture.
- Added three mouth states to the player shell: neutral, smile, and teeth-smile.
- The mouth states cycle in `animateVisiblePlayerShell` during idle and movement, creating a simple cartoon expression loop without requiring a facial rig.
- Verified with a successful Next.js production build.

## Character Hair, Expressions, Jump, And Floor Area

- Grouped the head, hair, eyes, pupils, and mouth into `shell-face-group`, so hair and facial features move together instead of drifting apart.
- Changed expression logic from a timer loop to proximity states: neutral away from photos, soft smile near a photo, teeth smile when a photo is close enough to highlight.
- Added a low `Space` jump using `PLAYER_JUMP_SPEED`, `PLAYER_GRAVITY`, `jumpOffset`, and `jumpVelocity`.
- Replaced boxy shoe meshes with capsule shoes and added foot lift/forward motion during walking.
- Reworked `WALKABLE_FLOOR` as a room-sized floor rectangle and narrowed `BLOCKED_FLOOR_AREAS` to wall furniture, benches, and tables so the central floor behaves like an open area.
- Verified with a successful Next.js production build and a browser screenshot of the lab scene.

## Player Cohesion And Top Layer Pass

- Rendered the visible playable character in a separate overlay Three.js scene after the garage, photos, and analysis props.
- Disabled automatic renderer clearing and now clear the frame manually before the garage pass, then clear only depth before the player pass.
- Lowered photo panel render order so photos remain readable but cannot visually cover the player overlay.
- Rebuilt the hair as a single helmet-like cap with a connected front lock, rear bridge, and bun inside `shell-face-group`.
- Tightened leg and shoe positions so the legs meet the capsule shoes cleanly and the walking animation uses smaller, smoother foot motion.
- Verified with a successful Next.js production build and a local HTTP `200 OK` response from `http://localhost:3000/`.

## Garage Collision And Keyboard Interaction

- Reworked the walkable garage area around a wider room floor with blocked rectangles for wall workbenches, cabinets, shelves, gas tanks, and the foreground table.
- Added `PLAYER_COLLISION_RADIUS` so the character body stays out of furniture instead of checking only the foot-center point.
- Increased photo and analysis proximity radii to compensate for the corrected furniture collision edges.
- Added an `analysis` proximity state for the chemistry station and made `KeyE` / `Enter` trigger the active nearby object: analysis first, then the nearest photo.
- Added a DOM `Press E` prompt over the garage canvas when the player is near an active photo or the chemistry station.
- Changed the hair shape from a full cap to a narrow long top strip connected to the rear bun, leaving the sides visually shaved.
- Verified with a successful Next.js production build and a local HTTP `200 OK` response from `http://localhost:3000/`.

## Table Edge, Rope Photos, And Yellow Highlights

- Extended the rear workbench collision farther toward the player so the character cannot stand inside the visible tabletop edge.
- Moved the first four memory photos onto the rope line and added a fourth rope clip so the hanging-photo row reads as intentional.
- Changed photo and analysis hover/proximity glow to a consistent soft yellow highlight instead of mixed accent colors.
- Added a top hair crown between the front/top strip and rear bun so the hairstyle remains connected from side camera angles while keeping the sides short.
- Verified with a successful Next.js production build.

## Hair Debug Hook And Forward Rope Row

- Moved the rope-row photos and rope clips forward along the room depth so the player can reach and activate them more comfortably from the floor.
- Strengthened the player hairstyle with a wider top cap and crown that connect the front hair area to the back bun.
- Added `window.__garageDebug.setHair(part, patch)` for temporary browser-console tuning of `cap`, `crown`, `front`, `bridge`, and `bun`.
- Added `window.__garageDebug.getHair()` and `window.__garageDebug.printHairControls()` so tuned hair values can be copied back into source constants.
- Verified with a successful Next.js production build.

## Garage Door Photo And Table Collision Tuning

- Applied the accepted `crown` hair debug values as the default hairstyle.
- Moved the first memory photo from the rope row onto the garage-door area.
- Shortened and recentered the rope row so it visually belongs to the three remaining rope photos.
- Added and expanded blocked floor rectangles around the foreground work table so the player cannot stand inside its legs or tabletop edge.
- Verified with a successful Next.js production build.

## Movement Recovery And Door Photo Placement

- Moved the player start position out of the foreground table collision zone.
- Added a nearest-walkable recovery step before movement so the character can escape safely if a future collision edit or hot reload places them inside a blocked area.
- Moved the first memory photo onto the larger empty garage-door panel shown in review.
- Verified with a successful Next.js production build.

## Explicit Photo Placement And Workflow Docs

- Replaced index-based photo placement with `PHOTO_LAYOUTS_BY_ID`, so each memory photo now has an explicit stable scene position by `memory-*` id.
- Moved `memory-01` and `memory-07` to the garage-door area and kept the rope row for `memory-02`, `memory-03`, and `memory-04`.
- Reduced the overly broad foreground-table collision block that made the walkable area feel too restricted.
- Added `docs/GARAGE_SCENE_GUIDE.md` with garage scene architecture, movement/collision logic, photo placement ids, interaction logic, hair tuning, and visual tuning workflow.
- Updated `README.md`, `docs/WORKFLOW_RULES.md`, and `docs/IMPLEMENTATION_PLAN.md` to reference the new garage guide and the clarification-first visual tuning workflow.
- Verified with a successful Next.js production build.

## Garage Door Photo Row Tuning

- Moved the three reviewed photos from the lab-board/analysis area into one readable garage-door row.
- The row order is `memory-07`, `memory-01`, then `memory-08`, matching the visual group from the review screenshot.
- Kept the change scoped to photo placement and docs; movement/collision polygons were not changed in this pass.

## Corrected Garage Door Photo Row

- Corrected the placement target: the reviewed group belongs on the same garage-door plane as `memory-05` and `memory-06`.
- Placed `memory-07`, `memory-01`, and `memory-08` between `memory-05` and `memory-06`.
- Tightened `docs/WORKFLOW_RULES.md` so marked-screenshot placement edits require a preview screenshot when browser tooling is available.

## Single Active Object Focus

- Changed photo proximity handling so only the nearest reachable photo gets the yellow active glow and scale boost.
- Analysis station proximity now blocks photo focus, matching the existing priority order for `Press E` / `Enter`.
- Documented the single-focus rule in `docs/GARAGE_SCENE_GUIDE.md`.

## Sneakers And Sports Ball Actions

- Copied the supplied sneaker, football, and basketball source assets into `public/assets/models/`.
- Replaced the visible player shell shoes with stylized high-top sneakers and added an optional runtime FBX sneaker overlay.
- Added football and basketball props to the garage scene.
- Implemented basic sports-ball actions: `E` picks up the focused floor ball, `E` throws the carried ball, and `F` kicks the focused floor ball.
- Kept ball actions simple by design: fixed force, friction, gravity, and blocker checks against the existing walkable-floor logic.
- Basketball currently uses procedural Three.js geometry because the provided source file is `.blend`, which is not browser-loadable.
- Verified with a successful Next.js production build.

## Mirror Character Customizer

- Copied the supplied mirror, T-shirt, shorts, and cap-source folders into `public/assets/models/`.
- Extracted `public/assets/models/clothing/man-shorts/source/LP.zip` into `public/assets/models/clothing/man-shorts/source/LP/`.
- Added `src/data/characterCustomization.ts` for default character settings and selectable editor options.
- Added a mirror station inside the garage with yellow focus glow and `Press E` interaction.
- Added a React character customizer modal opened from the mirror.
- Current editable categories: T-shirt color, shorts color, eye style, eyebrow style, and hair style.
- Kept clothing customization procedural for now because directly fitting arbitrary FBX/OBJ clothing meshes to the simple shell would require rigging and alignment work.
- Disabled the runtime sneaker FBX overlay and kept procedural high-top sneakers to avoid doubled or fragmented shoe geometry.
- Replaced the football texture render with a procedural white ball and black pentagon patches so it reads clearly as a football in the garage lighting.
- Browser QA confirmed the mirror appears in the walkable area, opens the modal through `E`, and applies selected changes to the visible character.

## Live Customizer Preview

- Extracted the procedural player shell, animation, and customization application into `src/components/playerShell.ts`.
- Added `src/components/CharacterPreviewCanvas.tsx` as a right-side Three.js live preview inside the mirror customizer modal.
- Updated the customizer modal layout so controls stay on the left and the synced character preview stays visible on the right.
- The same `CharacterCustomization` state now updates both the garage player and the modal preview immediately.

## Mirror Placement And Cap Controls

- Moved the customizer mirror deeper into the garage and farther from the analysis chemistry station.
- Increased the mirror station scale so it reads as a full-height floor mirror.
- Removed cap toggle and cap color controls from the Clothes section.
- Kept the cap available only as a Hair style option.

## Mirror Floor Anchor And Preview Centering

- Moved the mirror station back toward the open room floor so it is not pushed too far onto the wall/photo area.
- Changed the loaded mirror FBX preparation to normalize by bounding box and place the model bottom on the station floor.
- Reworked `CharacterPreviewCanvas` so the preview character is normalized inside a centered pivot group.
- The preview pivot now performs the small idle rotation, keeping the character centered instead of drifting toward a panel edge, and the orthographic view is wide enough to keep the full body in frame.
- Restored the cap color selector as a conditional control under the Hair section; it appears only when the `Cap` hair style is selected.
- Verified with a successful Next.js production build and local browser screenshots of the garage mirror plus the customizer preview.

## Preview Character Offset

- Added explicit preview-player offset constants in `CharacterPreviewCanvas`.
- Shifted the customizer preview character slightly upward and left, matching the requested visual nudge without changing the garage player position.

## Preview Scale And Hair Clearance

- Enlarged the customizer preview character by tightening the preview camera view height.
- Lowered the preview character slightly while keeping the existing left offset.
- Moved the bun hairstyle crown upward and backward and lifted the front hair lock so the eyebrows stay visible.
- `next build` reached compile, type check, and static page generation but stopped on a locked `.next/export/_next` cleanup path, likely because a dev process or browser had `.next` open.
- Verified the code with `tsc --noEmit --ignoreDeprecations 6.0`.

## Connected Bun Hair Recovery

- Restored the bun hairstyle to a connected top mass from the forehead area toward the rear bun.
- Kept the front lock slightly raised and thinner so the eyebrows remain readable in the customizer preview.
- Updated the browser-console hair tuning examples to match the current source values.

## Ball Mirror Glow And Sneaker Back Pass

- Removed the proximity glow meshes from sports balls and the mirror while keeping their prompts and interactions active.
- Raised and deepened the procedural high-top sneaker collar and rear heel pieces so the shoes cover the back of the ankle better.
- Updated the implementation notes and garage guide to document that balls and the mirror are prompt-driven without yellow glow.

## Hair Shape And Preview Stability Pass

- Stopped re-normalizing the live customizer preview after every option change, removing the visible jump when selecting a category option.
- Simplified the bun hairstyle into flatter connected top pieces so the front bump does not protrude from side views.
- Changed `shortTop` hair so it uses only raised front/top pieces and no rear crown, bridge, or bun.
- Raised and enlarged the cap-style hair option so the head top no longer peeks through the cap.
- Reworked the procedural sneaker rear geometry into a single taller collar and separated black heel panel to reduce overlap flicker and hide the ankle better while walking.

## Desktop Finale And Analysis Label Pass

- Moved the analysis station label forward and upward and made its label material render over nearby station props so the `START` text stays readable.
- Pushed the analysis flasks and tube rack backward on the tray so they no longer sit directly over the label.
- Reworked the final scene for desktop presentation: the dialogue card is now a large top-aligned screen area instead of a small bottom window.
- Moved the final 3D character models farther toward the left and right sides of the desktop frame.
- Extended the bun hairstyle top coverage forward and hid the separate short front hair piece for the bun option.
- Raised the cap option again so the head top does not peek through it.

## Sneaker Mirror And Finale Layer Pass

- Lowered and shortened the procedural sneakers so they read as shoes instead of tall boots.
- Moved the sneaker base backward on the character depth axis and reduced walking shoe lift so the lower leg stays inside the shoe during movement.
- Added the floor mirror footprint to the blocked movement areas so the player can approach it but cannot walk through it.
- Moved the finale scientist and buddy models farther outward from the dialogue card.
- Raised the final scene text layer above the character canvas so the models cannot cover the dialogue text.

## Finale Brightness And Card Gap Pass

- Removed the full-screen final-scene dark overlay so the finale character models stay bright.
- Kept the final dialogue card above the 3D character canvas, with the canvas still above the background.
- Narrowed the final dialogue card by 60px on desktop, creating roughly 30px more side space for the finale characters.
- Nudged the finale character groups slightly inward after narrowing the card so they sit close to the card edges without entering the text area.

## Finale Separation Correction

- Removed the temporary brightness/saturation filter from the finale character canvas so the models use their normal material lighting again.
- Narrowed the final dialogue card further on desktop so it stays centered and leaves clearer side zones.
- Moved the finale character groups outward again so they read as separate side characters and do not touch the dialogue card.

## Scanner Panel Reference Pass

- Restyled only the first-screen scanner panel and scanner text, leaving the scanner background and noise layer unchanged.
- Added a compact terminal-style top bar with the diagnostic unit label and stable signal badge.
- Reworked the scanner content into two dark glass cards: system diagnostics on the left and object profile on the right.
- Moved the portal CTA into the profile card and changed it to a calm green terminal button.
- Removed the neon glitch treatment from the scanner headline so the first screen reads closer to the supplied dark diagnostic reference.

## Scanner Panel Spacing Pass

- Increased the desktop scanner panel maximum width from `1320px` to `1400px` so the long headline keeps balanced clearance from both side borders.
- Reduced the gap between the scanner top bar and the main headline by half while preserving the existing background, noise, content, and interaction behavior.

## Scanner Reveal Timing Pass

- Increased the diagnostic row stagger from `0.38s` to `0.62s` and slightly lengthened each row reveal for a more readable system-scan sequence.
- Hidden the complete object profile card during the initial scan instead of showing an empty card shell.
- Synchronized the profile card reveal with the start of the final diagnostic row, then revealed its values and portal action in sequence.

## Scanner Diagnostic Copy Pass

- Replaced the diagnostic sequence with the supplied ten-step player scan copy.
- Added a structured error status to scanner rows and rendered the Jerry detection error with a red warning indicator while keeping all successful rows green.
- Preserved the synchronized profile reveal so it now starts with the new final `Отчёт готов.` row.

## Celebrant Name Update

- Replaced the placeholder multiverse hero name with `Roman Borzov` in the shared birthday configuration.
- The scanner profile and later analysis views now receive the updated name from the same source.

## Scanner Correction Pause

- Added a dedicated `0.88s` pause before the `Ошибка исправлена.` diagnostic row, including the requested additional `500ms` delay.
- Kept the original `0.62s` rhythm for every row after the correction message.
- Included the extra pause in the final-row timing so the profile card remains synchronized with `Отчёт готов.`.

## Portal Instruction Copy And Pulse

- Updated the portal gun screen copy to match the supplied reference: charged status, `ДАЙ ИМПУЛЬС!`, and the short `Нажми на портальную пушку` instruction.
- Removed the extra explanatory text after the portal-gun instruction.
- Added a repeating scale, opacity, and brightness pulse to the instruction before the gun is fired; the pulse stops during charging and after the portal opens.

## Portal Copy Poster Styling

- Restyled the complete initial portal copy as one comic poster composition with a larger condensed headline, dark outline, cyan and magenta offset shadows, an acid-yellow status line, and a brighter instruction line.
- Moved the attention animation from the instruction alone to the entire three-line copy group.
- Kept the repeating pulse limited to the pre-fire state so charging and portal-ready copy remain stable.

## Portal Pulse Scope Correction

- Returned the repeating attention pulse to the bottom `Нажми на портальную пушку` instruction only.
- Slightly increased the charged-status text size and added `0.2px` letter spacing.
- Preserved the comic poster styling of the static status line and main heading.

## Portal Status Legibility Pass

- Replaced the narrow `Impact` status-line typeface with a wider heavy sans-serif stack.
- Increased the charged-status size and added an explicit line height for cleaner Cyrillic rendering.
- Replaced the strong acid glow with a thin dark stroke, short dark shadow, and restrained glow so the text stays readable over the portal scene.

## Portal Copy Vertical Spacing

- Increased the gap between the charged-status line and the main heading from `8px` to `23px`, including the final requested `5px` adjustment.
- Increased the gap below the shadowed heading to the pulsing instruction from `18px` to `30px` so none of the text layers overlap.

## Analysis Copy Replacement

- Updated specimen rarity to `0.00030% - Легендарный (Mythic)` and compatibility to `99.9% с хаосом, юмором и приключениями`.
- Replaced the previous eight achievement cards with the supplied seven titles and descriptions.
- Added an animated `🟢 Achievement Unlocked` heading above the achievement grid.
- Replaced the analysis-complete banner with the supplied no-matching-specimen message.

## Analysis HUD Redesign

- Rebuilt the analysis result as a dense comic sci-fi game HUD based on the supplied visual reference.
- Added a scanned-profile header, large celebrant name, multiverse rarity ribbon, icon-led profile statistics, a dedicated level card, an achievement unlock ribbon, illustrated achievement cards, and a framed system result banner.
- Generated a text-free project-local HUD background so all production copy remains selectable, sharp, and editable HTML.
- Reused tightly cropped artwork regions from the supplied reference as achievement and profile-card sprites without baking the interface copy into the page.
- Increased the analysis dwell time from `9.4s` to `16.8s` so the expanded result can be read before the automatic finale transition.
- Verified the complete result at a `1280x720` desktop viewport and saved the full-page evidence to `docs/screenshots/analysis-modal-hud.png`.
- Confirmed `pnpm run build` passes with Next.js `16.2.12` and TypeScript validation enabled.

## Portrait And Finale Narrative Pass

- Replaced the analysis profile-card placeholder crop with the supplied Roman Borzov portrait at `public/assets/analysis/roman-portrait.png`.
- Converted the finale dialogue from plain text rows into structured Rick and Morty sections with italic reactions, highlighted values, a diagnostic checklist, a level-up callout, and line-by-line wishes.
- Renamed every scientist dialogue entry to `Рик` and every companion entry to `Морти`; the last scientist wish block also uses `Рик` for consistency.
- Increased the analysis dwell time from `16.8s` to `18.8s` and the Rick/Morty result dwell time from `9.8s` to `11.8s`.
- Restyled the last birthday card as a left-aligned sci-fi HUD with a top portal status, a large season headline, the exact supplied birthday line, and a bottom loaded-season status.
- Generated and chroma-keyed a clean transparent finale character asset, cropped its transparent padding, and added a separate comic speech bubble over the existing final-scene background.
- Copied every production source used in this pass into the repository, including the original finale character, Roman portrait, and final-card reference.
- Verified the analysis portrait, complete structured dialogue, and final epilogue at `1280x720` and saved evidence to:
  - `docs/screenshots/analysis-modal-portrait.png`
  - `docs/screenshots/final-dialog-structured.png`
  - `docs/screenshots/final-epilogue-stinger.png`
- Confirmed the production build passes in an isolated Next.js output directory while the existing dev server continues to own `.next`; the temporary output and temporary config override were removed after verification.

## Portrait Crop And Finale Headline Hierarchy

- Increased the analysis portrait card height and top-aligned the portrait crop so the full hairstyle remains visible.
- Split the final headline into a smaller `Добро пожаловать в` lead and the existing large `30-й сезон жизни!` title.
- Corrected the final greeting to the exact copy `С днем рождения!` without a trailing period.
- Preserved the responsive headline scale by sizing both title levels relative to the existing desktop and mobile heading rules.

## Agent Documentation And Repository Hygiene

- Expanded `.gitignore` for dependencies, Next.js output, package-manager caches, TypeScript state, logs, local environment files, editor state, coverage, and temporary visual artifacts.
- Kept production assets and durable review screenshots outside ignored paths.
- Added `AGENTS.md` as the mandatory agent entry point with inspection, baseline-test, clarification, implementation, visual verification, and reporting rules.
- Added `docs/ARCHITECTURE.md` with the runtime state machine, source ownership, data flow, rendering layers, timers, tuning map, styling boundaries, and known constraints.
- Added `docs/TESTING.md` with pre-change baselines, a post-change verification matrix, full desktop smoke test, Three.js visual assertions, and temporary scene-isolation rules.
- Rewrote the README, implementation plan, workflow rules, storyboard, and asset documentation to match the current source instead of earlier design intentions.
- Added `pnpm typecheck` and configured TypeScript 6 deprecation handling so the fast baseline check is repeatable.
- Confirmed `pnpm typecheck` and `pnpm build` pass with Next.js `16.2.12`.
- Checked all local Markdown links across the agent guide, README, and technical documentation; no broken local links were found.
- Verified all documented core source and portrait paths exist.
- Visually confirmed the restored normal `scanner` start, Russian scanner title, portal CTA, HTTP `200` response, and two nonzero WebGL canvas buffers.
- Saved the final startup evidence to `docs/screenshots/scanner-normal-start.png`.
- Recorded the existing `FBXLoader` negative-material-index warning as known supplied-asset debt; it did not prevent the verified scene from rendering.
