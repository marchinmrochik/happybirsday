# Assets

This directory is the deployable asset root. Runtime URLs start with `/assets/`.

Rules:

- copy every active supplied file and all of its dependencies into this directory;
- never reference `Downloads`, temporary folders, or absolute local paths from source;
- preserve stable filenames once source code references them;
- keep original references or source-only models only when they support future maintenance;
- document active, fallback, and source-only status in `docs/ASSET_BRIEF.md`;
- verify public-use rights before deployment.

Main groups:

- `analysis/`: HUD skin, sprite/reference image, and Roman portrait;
- `audio/`: looping music;
- `finale/`: transparent final character;
- `garage-fan-art/`: active garage FBX and textures;
- `memories/`: active photo textures;
- `models/`: player, final characters, mirror, props, shoes, and clothing sources;
- `portal-3d/`: active portal model;
- `portal-gun/`: active portal gun;
- `references/`: preserved visual inputs used to produce current assets.

See `docs/ASSET_BRIEF.md` for the complete status table and integration workflow.

