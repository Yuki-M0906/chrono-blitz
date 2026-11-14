# Character design refresh — v3.3.0

2026-11-13. Built on the externally updated v3.2.0, including its natural voice acting and v3.1.0 impact sound effects.

## Design masters

The seven PNGs in `concepts/` are the costume and facial design masters. `concepts.json` records their built-in image_gen prompts and original output paths. Gameplay uses the transparent atlases, not these white-background design sheets.

| Character | Preserved concept | Refined design |
|---|---|---|
| Kagura | Japanese fire katana swordsman | Long sleek ponytail, cropped charcoal haori, wine-red gi, crimson scarf, tapered hakama and dark shin guards |
| Volt | Lightning street martial artist | Blond undercut, cyan visor/scarf, navy technical vest and joggers, white geometric panels and sneakers |
| Freya | Northern ice knight | Braided silver hair, light articulated silver armor, navy split coat and cobalt half-cape |
| Titan | Veteran heavyweight earth fighter | Sculpted silver beard, charcoal/ochre martial layers, angular brass gauntlets and substantial boots |
| Ayame | Japanese moon-fan kunoichi | Long black ponytail, asymmetric aubergine kimono, fitted black combat suit, ivory crescent obi |
| Celine | Western aristocratic rapier duelist | Auburn asymmetric bob, emerald tailored tailcoat, ivory blouse, burgundy sash and sleek brown boots |
| Iron Voss | Original armored crime lord | Silver temples, gunmetal jaw mask, architectural oxblood coat, hydraulic gauntlets and one armored shoulder |

## Asset contract

- `assets/sprites/design-v33/`: 18 shared atlases; six fighters × base/motion/throw × 24 poses.
- `assets/belt/art/design-v33/`: six dash atlases and three Voss atlases, 24 poses each.
- Total: 27 PNGs, 648 poses. Every source is 1536×1024 RGBA, six columns by four rows, 256px nominal cells.
- Image generation uses each new master as the identity/costume reference and the corresponding previous atlas as the pose/layout reference. Preserve the distinction when regenerating.
- `prompts.json` records the final adopted files, exact prompts, references, and generated originals. Provider: built-in image_gen; no external API integration is needed to play.
- Existing 384px cached cells, 64px bleed, anchor (192,308), and display scale 1.15 are retained. The shared renderer removes neighboring connected components and faint alpha haze while retaining antialiased edges.
- Enemies continue using the existing shared palette system, so their costume silhouettes also update automatically.
- Frame indices, attack timing, throw synchronization, dash state transitions, hitboxes and all game rules remain those of v3.2.0.

## Build and verification

Run `node tools/build-sprites.mjs` to pack the new PNGs into the existing eleven data packs and embed the renderer sources into the HTML. Do not edit generated blocks by hand. Distribute the HTML with the complete `data/` folder.

`node tools/verify-anime.cjs` compares against `ai_studio_code.v3.2.0.backup.html` and `backup/`, checks all 27 adopted sources and all 648 decoded poses, and writes contact sheets plus both-mode screenshots to `verification/design-v33/`. `baseline-hashes.json` captures the original v3.2.0 state; never update it merely to make a failed preservation check pass.

The original v3.2.0 HTML and touched source/build files are backed up. Original v3.0 atlas directories are retained. Audio, voices, scenery, props and their existing histories are unchanged.

## Final visual corrections

Freya base and Celine motion background extraction was regenerated. Titan throw haze, Freya dash effect separation, and Celine motion idle/airborne blade were refined with image_gen; exact additional prompts and original paths are in `refinements*.json` and `refinement-celine-blade.json`, with final adopted source paths in `prompts.json`. No PNG was raster-edited with a script. Celine idle3 now has planted feet in the actual image, so the old frame substitution is removed. Titan base15 alone excludes detached effects to avoid rock chips from neighboring rush16. All other cells use the existing connected-component cleaner without old atlas-specific restrictions.

## Verified outcome

All eleven verification scripts completed with exit code 0 on 2026-11-13. See `verification/design-v33/validation.json` and `report.json`. All seven contact sheets were visually reviewed; both games display the new costumes, all six heroes clear Street stage 1, 72 throw pairs and 2,880 combat frames pass, all 126 voices decode, and eight BGM tracks plus effects pass the standalone audio check. The HTML header contains the detailed Japanese history and restoration paths.
