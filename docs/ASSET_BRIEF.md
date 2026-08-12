# Asset Brief

All production dependencies and preserved source files live under `public/assets/`. Runtime code must use root-relative `/assets/...` URLs and must not reference `Downloads`, temporary directories, or absolute local paths.

## Runtime Asset Inventory

| Area | Runtime path | Loader or usage | Status |
| --- | --- | --- | --- |
| Portal | `portal-3d/green-portal.glb` | `GLTFLoader` in `PortalVerseCanvas` | Active. |
| Portal texture | `portal-3d/gltf_embedded_0.png` | Portal model dependency/reference | Preserved with portal source. |
| Portal gun | `portal-gun/portal-gun.fbx` | `FBXLoader` in `PortalVerseCanvas` | Active. |
| Garage | `garage-fan-art/source/Rick and Morty Garage.fbx` | `FBXLoader` in `GarageSceneCanvas` | Active. |
| Garage textures | `garage-fan-art/textures/*.png` | Explicit texture mapping in `GarageSceneCanvas` | Active. |
| Player source | `models/cartoon-runner-v2.glb` | Loaded for source animations/model data | Active source; the reliable visible body is the procedural shell. |
| Mirror | `models/mirror-a/source/mirrorA.fbx` | `FBXLoader` plus procedural fallback | Active when load succeeds. |
| Memory photos | `memories/memory-01.png` through `memory-08.png` | Three.js textures and React photo modal | Active. |
| Analysis HUD | `analysis/analysis-hud-background.png` | CSS background skin | Active. |
| Analysis sprites | `analysis/analysis-modal-reference.png` | CSS sprite source | Active reference-derived artwork. |
| Analysis portrait | `analysis/roman-portrait.png` | HTML image in the profile card | Active. |
| Scientist finale model | `models/rick-sanchez.glb` | `GLTFLoader` in `CharacterModelsCanvas` | Active. |
| Companion finale model | `models/morty-new.fbx` | `FBXLoader` in `CharacterModelsCanvas` | Active. |
| Companion texture | `models/Morty_Color.png` | Preserved alongside the FBX | Active/source dependency depending on material resolution. |
| Music | `audio/rick-and-morty-theme.mp3` | HTML audio element | Active after portal user gesture. |
| Final transparent character | `finale/final-character.png` | HTML image in the epilogue | Active. |

## Procedural Runtime Visuals

These production visuals are generated in code rather than loaded from the supplied model files:

- visible player body, face, hair, T-shirt, shorts, cap, and high-top sneakers in `playerShell.ts`;
- football and basketball in `GarageSceneCanvas.tsx`;
- mirror fallback and its interaction target;
- garage room shell, analysis station, photo frames, rope, and clips;
- portal support rings, click targets, particles, and beam;
- Web Audio interaction effects.

Do not replace a procedural fallback only because a source asset exists. Replace it only after the imported asset is browser-ready, correctly oriented, correctly materialed, interaction-safe, and visually verified.

## Preserved Source Or Fallback Assets

| Path | Current role |
| --- | --- |
| `models/stylized-air-jordan/stylized-air-jordan.fbx` | Source-only. Runtime overlay is disabled because it duplicated shoe geometry. |
| `models/football/` | Source and textures preserved. Runtime football is procedural because the imported result read too dark. |
| `models/basketball/Basketball_dl.blend` | Source-only. Browsers do not load `.blend` directly. |
| `models/clothing/` | Source-only. Arbitrary clothing meshes are not fitted or rigged to the procedural player. |
| `models/morty-smith.fbx` | Previous fallback/reference, not the selected final companion. |
| `models/morty-color.png` | Duplicate/lowercase companion texture kept for source compatibility. |
| `garage-scene.jpg` | Legacy flat garage reference, not the active environment. |
| `portal-reference.jpg` and `portal-reference-clean.png` | Legacy portal references, not the active portal. |
| `references/final-character-source.png` | Preserved source reference for the transparent final character. |
| `references/final-modal-reference.png` | Preserved final-card visual reference. |

## Adding Memory Photos

1. Copy the image to `public/assets/memories/` using the next stable name, for example `memory-09.png`.
2. Add the id, label, and root-relative source to `decorativePhotos` in `src/data/story.ts`.
3. Add an explicit `PHOTO_LAYOUTS_BY_ID` entry in `GarageSceneCanvas.tsx`.
4. If the photo belongs to the rope row, update the decorative clip list in `createPhotoRope()`.
5. Verify the panel from the player approach path, the single-object focus, `E` interaction, click interaction, modal crop, and collision access.
6. Save final placement evidence to `docs/screenshots/` and update the progress log.

Do not rely on fallback placement for a reviewed photo.

## Replacing A 3D Asset

Before integration:

1. prefer `.glb` for self-contained browser delivery; use `.fbx` only when its material and texture dependencies are understood;
2. inspect axis orientation, real bounds, scale, pivot, material names, opacity, and texture paths;
3. copy the complete asset dependency set into `public/assets/`;
4. normalize the model from a bounding box instead of assuming source units;
5. preserve a procedural fallback for critical interactions until the imported result is verified;
6. dispose geometries, materials, textures, renderers, listeners, and animation frames on React cleanup;
7. verify a nonblank canvas, correct framing, materials, animation, and raycast target at desktop size.

## Reference-Derived Artwork

- The analysis HUD background is text-free. Product copy remains live HTML.
- `analysis-modal-reference.png` is used for selected decorative artwork and must not become the source of editable text.
- `final-character.png` is an alpha-transparent production cutout. Do not reintroduce a white or checkerboard background.
- Original references are preserved in `public/assets/references/` so later changes do not depend on temporary uploads.

## Rights Review

Before public deployment, confirm public web usage rights for:

- character and franchise-inspired models;
- the music track;
- garage, portal, prop, mirror, shoe, and clothing models/textures;
- personal photos and generated transformations;
- reference-derived HUD and character artwork.

Private local preview does not establish public distribution rights.

