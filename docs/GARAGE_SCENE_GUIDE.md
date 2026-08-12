# Garage Scene Guide

This document explains the current garage scene implementation and the required workflow for future visual tuning. Read `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/TESTING.md` first.

## Main Files

- `src/components/GarageSceneCanvas.tsx`: Three.js garage scene, player movement, photos, analysis station, keyboard interaction, and debug hooks.
- `src/components/playerShell.ts`: shared procedural player shell, animation, and customization application used by the garage character and the customizer preview.
- `src/components/CharacterPreviewCanvas.tsx`: small Three.js live preview rendered inside the mirror customizer modal.
- `src/data/story.ts`: birthday text, profile stats, achievements, final dialogue, and the list of memory photo ids.
- `public/assets/memories/`: real memory images used by the garage photo panels and modal.
- `public/assets/models/stylized-air-jordan/`: supplied sneaker FBX copied into the deployable project.
- `public/assets/models/football/`: supplied football FBX and textures copied into the deployable project.
- `public/assets/models/basketball/`: supplied basketball `.blend` source; the runtime scene uses a procedural basketball until a browser-ready `.glb` or `.fbx` is provided.
- `public/assets/models/mirror-a/`: supplied mirror FBX and textures copied into the deployable project.
- `public/assets/models/clothing/`: supplied clothing/source assets copied into the deployable project. Runtime customization currently uses the stable procedural player shell instead of directly fitting these meshes.
- `src/data/characterCustomization.ts`: default character setup and selectable editor options.
- `app/globals.css`: garage overlays, interaction prompt, photo modal, and customizer modal styles.

## Scene Structure

`GarageSceneCanvas` creates two Three.js scenes:

- `scene`: garage room, garage FBX model, memory photos, analysis station, lights, and atmosphere.
- `playerScene`: visible playable character shell plus a currently carried sports ball, rendered after the main scene.

The renderer manually draws in this order:

1. clear frame;
2. render the garage scene;
3. clear depth only;
4. render the player scene.

This keeps the character visible above transparent photo panels and garage layers. A carried ball joins this scene only while held, so its position follows the rendered player rotation instead of a separately updated world-space offset.

## Player Movement

The player state lives inside the main `useEffect` in `GarageSceneCanvas`. The scene is third-person: the camera follows the player and supports horizontal look, while vertical pitch remains fixed. `updateChaseCamera()` raycasts from the current look target to the desired chase position against the room, imported garage, analysis station, and mirror. On a hit, the camera snaps to a clearance point in front of the blocking surface so a frame cannot be rendered outside the room.

Important constants:

- `PLAYER_START`: initial world position.
- `PLAYER_WALK_SPEED` and `PLAYER_RUN_SPEED`: movement speeds.
- `PLAYER_COLLISION_RADIUS`: body padding used when checking furniture collisions.
- `CAMERA_COLLISION_CLEARANCE` and `CAMERA_MIN_DISTANCE`: wall/prop clearance for the chase camera.
- `WALKABLE_FLOOR`: outer allowed floor polygon.
- `BLOCKED_FLOOR_AREAS`: rectangular furniture blockers.

Movement uses `movePlayerOnFloor()`:

1. if the player is already inside a blocked area, `moveToNearestWalkableFloorPoint()` pushes them to the nearest free point;
2. X movement is tested separately;
3. Z movement is tested separately;
4. blocked furniture areas include the collision radius.

This means a bad collision edit can no longer permanently freeze the player, but oversized blockers can still make the floor feel too narrow.

## Controls

Desktop:

- `WASD` or arrow keys: move.
- `Shift`: run.
- `Space`: small jump.
- mouse drag: camera/look or movement depending on pointer area.
- `E` / `Enter`: trigger the nearest active object.
- `F`: kick the nearest active sports ball.

Touch:

- lower half drag: movement.
- upper half drag: horizontal look control.

## Active Objects

The active object priority is:

1. analysis station;
2. carried sports ball;
3. nearest sports ball;
4. mirror customizer;
5. nearest photo.

When the player is close to an active object:

- the DOM prompt `Press E` appears;
- pressing `E` or `Enter` does the same as clicking/tapping the object;
- pressing `F` kicks the active sports ball when one is on the floor.

Only one object can be keyboard-active at a time:

- if the analysis station is close enough, it owns the focus and photo focus is disabled;
- if a sports ball is carried, `E` throws it forward and all other focus is disabled;
- otherwise, only the nearest sports ball, mirror, or photo inside its interaction radius owns the `Press E` prompt;
- photos and the analysis station keep their yellow proximity glow;
- sports balls and the mirror do not render proximity glow meshes; their interaction remains prompt-driven.

## Mirror Customizer

The customizer mirror is created by `createMirrorStation()`.

Main constants:

- `MIRROR_STATION_TUNING`: mirror position, rotation, scale, and hitbox.
- `MIRROR_INTERACTION_RADIUS`: distance needed to show `Press E`.
- `MIRROR_MODEL_URL`: optional supplied FBX mirror source.

The mirror uses a procedural fallback immediately. The supplied FBX is loaded as a visual replacement when available. The loaded model is normalized by its bounding box so its bottom sits on the floor at the station origin. If the FBX fails or looks wrong, the fallback still keeps the interaction usable.

`createMirrorMaterials()` owns the shared visual treatment for both paths. The glass uses a generated dark cyan reflection texture with diagonal highlights, the frame uses dark wood color, the backing is blue-black, and the arms/base/legs use teal hardware color. The supplied texture set is preserved under `public/assets/models/mirror-a/textures/`, but the explicit runtime part materials prevent the imported FBX from reverting to a flat gray surface when its single material assignment is invalid.

Pressing `E` near the mirror calls `onCustomizerOpen`, which opens the React modal in `BirthdayExperience`.

The modal edits `CharacterCustomization` state:

- T-shirt color;
- shorts color;
- eye style;
- eyebrow style;
- hair style, including the cap option;
- cap color, shown only when the `Cap` hair style is selected.

`GarageSceneCanvas` receives this state as a prop. The scene applies it to named shell parts only when the customization key changes, so temporary hair debug edits are not overwritten every frame.

`CharacterPreviewCanvas` receives the same state and renders the same shared procedural shell inside the modal. Any modal option change immediately updates both the right-side preview and the in-garage character because both call `applyPlayerCustomization()` from `playerShell.ts`. The preview character is normalized only when it is created, then customization changes are applied in place so the preview does not jump when options change.

## Sports Balls

Sports balls are created in `createSportsBalls()`.

- Football is procedural: a white ball with black pentagon patches. This replaced the supplied texture because the imported texture made the ball look partly black and unclear in the garage lighting.
- Basketball is procedural because the supplied `.blend` file is not browser-loadable.
- `E` picks up the focused ball.
- `E` throws the carried ball forward.
- `F` kicks the focused floor ball forward.
- Sports balls do not render proximity glow; the DOM prompt carries the interaction hint.
- Ball motion is intentionally simple: fixed throw/kick speed, friction, gravity, and blocker checks against the same walkable floor logic used by the player.
- Pickup reparents the selected ball from `sportsGroup` to the player root while preserving a stable local hand offset. Throw reparents it back to `sportsGroup` before applying velocity.
- Throw and kick directions use the player's currently rendered rotation, not only the target yaw, so an action during a turn matches the visible facing direction.

The prompt is intentionally short:

- `Press E / F` near a floor ball.
- `Press E` while carrying a ball.

## Photo Placement

Photo positions are now explicit by id in `PHOTO_LAYOUTS_BY_ID`.

Do not rely on array order when moving photos. Use the id:

- `memory-01`: black-shirt selfie with two people.
- `memory-02`: restaurant/table couple photo.
- `memory-03`: juice/carton photo.
- `memory-04`: cathedral photo.
- `memory-05`: sunbed/sunglasses photo.
- `memory-06`: sea rocks photo.
- `memory-07`: gummy-candy photo.
- `memory-08`: grill/backyard photo.

Each photo placement has:

- `position: [x, y, z]`
- `rotation: [rx, ry, rz]`
- `width`
- `height`

Coordinate hints:

- `x`: left/right inside the garage.
- `y`: height from the floor.
- `z`: depth in the room.
- For panels facing the garage door/front wall, use `rotation.y = Math.PI`.
- For panels facing the right wall, use `rotation.y = -Math.PI / 2`.
- For panels facing the left wall, use `rotation.y = Math.PI / 2`.

Current intent:

- `memory-05` and `memory-06` are the existing outer photos on the garage-door plane.
- `memory-07`, `memory-01`, and `memory-08` sit between `memory-05` and `memory-06` on that same plane.
- `memory-02`, `memory-03`, and `memory-04` hang on the rope row.
- the remaining photos stay on side/front wall zones.

## Rope Row

`createPhotoRope()` creates only the decorative rope and clips.

It does not place photos. The rope positions should match the ids currently intended to hang on it. If a photo moves off the rope, adjust the clip list too.

Current rope photo ids:

- `memory-02`
- `memory-03`
- `memory-04`

## Analysis Station

`ANALYSIS_STATION_TUNING` controls the chemistry station:

- `position`: world placement.
- `rotation`: world rotation.
- `scale`: station size.
- `hitboxPosition`: invisible click/press target offset inside the station group.
- `hitboxSize`: invisible click/press target size.

The station highlights when the player is within `ANALYSIS_INTERACTION_RADIUS`.

The `START` plane uses normal depth testing. The station props and the floor mirror can therefore occlude the label when they are physically in front of it; do not disable `depthTest` to improve label readability.

## Player Hair

The visible player shell uses separate hair parts:

- `cap`: top hair strip.
- `crown`: top mass connecting the front and bun.
- `front`: front lock.
- `bridge`: back connector.
- `bun`: rear bun.

Temporary browser-console tuning:

```js
window.__garageDebug.getHair()
window.__garageDebug.setHair("crown", { y: 1.84, z: -0.12, sx: 0.92, sy: 0.58, sz: 1.22 })
window.__garageDebug.setHair("cap", { y: 1.865, z: 0.025, sx: 1.06, sy: 0.34, sz: 1.52 })
window.__garageDebug.setHair("front", { y: 1.846, z: 0.178, sx: 0.64, sy: 0.34, sz: 0.42 })
```

After good values are found, copy them into `createVisiblePlayerShell()`.

## Player Shoes And Clothing

The visible player shell uses procedural high-top sneakers for stability.

Current shoe fit is controlled in `src/components/playerShell.ts`:

- `SHOE_BASE_Y` keeps the sneakers low on the floor.
- `SHOE_BASE_Z` centers the sneaker around the lower leg depth.
- `createStylizedSneaker()` controls the sole, toe, upper, collar, heel, side panel, tongue, and laces.
- `animateVisiblePlayerShell()` moves the sneakers with the walking legs. Keep the shoe lift lower than the leg lift so the shoe reads as attached instead of floating.

The supplied sneaker FBX remains copied in `public/assets/models/stylized-air-jordan/`, but the runtime overlay is currently disabled because it created doubled/fragmented shoe details on the simple shell legs. Re-enable and retune it only if a rigged character model is introduced.

The supplied T-shirt, shorts, and cap-like source folders are stored in `public/assets/models/clothing/`. The current game-style editor changes the procedural shell materials and simple cap geometry instead of fitting those meshes directly.

Note: the provided `cap` folder currently contains `Cup_LP.fbx`, which appears to be a cup-like asset rather than a wearable cap. The runtime cap is therefore procedural.

## Movement Collision

`WALKABLE_FLOOR` defines the broad garage floor rectangle.

`BLOCKED_FLOOR_AREAS` removes occupied floor zones from that rectangle. It currently blocks:

- wall-side benches and cabinets;
- the foreground table;
- the right-side storage zones;
- the floor mirror footprint.

Keep mirror interaction and mirror collision separate: `MIRROR_STATION_TUNING.hitboxSize` controls the `Press E` interaction area, while `BLOCKED_FLOOR_AREAS` controls whether the player can walk through the mirror.

## Visual Tuning Workflow

Use this workflow for future visual edits:

1. Read the current source positions before changing anything.
2. Identify the exact object by id or constant name.
3. If the request names a visual object but the id is ambiguous, ask a short clarification question before editing.
4. If a screenshot has an arrow or marked target, map it to world coordinates and state the inferred target in the work update.
5. For uncertain placement work, make a small change first.
6. If browser screenshot tooling is available, capture a preview screenshot and ask for confirmation before doing repeated tuning.
7. If screenshot tooling is not available, ask the user for a confirmation screenshot after the first small change.
8. Avoid broad collision changes unless the user explicitly asks for a full movement remap.
9. Record meaningful scene changes in `docs/PROGRESS_LOG.md`.

## When To Ask Questions

Ask before implementation when:

- more than one photo/object could match the request;
- the requested target location is described only as "there" or "that one" without a clear screenshot mark;
- moving one object may break another interaction;
- a collision change may reduce movement freedom;
- a requested visual change conflicts with the current scene geometry.

Keep questions short and specific, for example:

```text
Which photo id should move to the garage door: memory-07, memory-01, memory-08, or the whole reviewed group?
```

## Verification

After garage code edits:

1. run `pnpm typecheck`;
2. run the affected interaction or movement path from the normal garage scene;
3. verify collision access to the edited object and the neighboring objects;
4. capture a desktop screenshot and inspect the Three.js canvas for nonblank output, clipping, transparency, and duplicate geometry;
5. for carried-object changes, rotate the player while holding the object and verify it remains attached before and after the turn;
6. run `pnpm build` for release work or broad shared-runtime changes;
7. restore the normal `scanner` start after any temporary phase isolation;
8. record verified results in `docs/PROGRESS_LOG.md`.
