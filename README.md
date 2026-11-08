# CHRONO BLITZ: ARCADE COLLECTION

Browser-only arcade collection in a single HTML file: the 1-on-1 2D fighter **OVERDRIVE** and the side-scrolling beat 'em up **NEON UPRISING**. / 1 つの HTML だけで動くアーケードコレクション。2D 対戦格闘「OVERDRIVE」と 1 人用ベルトスクロールアクション「NEON UPRISING」。

**▶ Play the demo / デモをプレイ:** https://yuki-m0906.github.io/chrono-blitz/

> The game itself is one 85 MB HTML file (`ai_studio_code.html`) with all sprites, backgrounds, voice clips and code embedded. The first load takes a while; later loads are cached. Keyboard required.
> ゲーム本体は約 85MB の単一 HTML です。初回読み込みには時間がかかります。キーボードが必要です。

## Games / 収録ゲーム

| | OVERDRIVE | NEON UPRISING |
|---|---|---|
| Genre | 1-on-1 versus fighting | Side-scrolling beat 'em up (1 player) |
| Content | 6 fighters, 4 stages, ARCADE / VS CPU / VS 2P / TRAINING | Stage 1 "BLACK VEIN": 5 areas, 33 enemies, boss IRON VOSS |
| Systems | Gatling cancels, command-input bonus, just guard, drive burst, synchronized throws | Depth movement, grabs / knee strikes / throws, emergency spin attack, breakables and pickups, lives and 1UP |

## Controls / 操作

| | 1P (OVERDRIVE) | NEON UPRISING |
|---|---|---|
| Move | `W` `A` `S` `D` (or arrows) | `W` `A` `S` `D` (up/down = depth) |
| Light / Heavy | `J` / `K` | `J` attack and pick up |
| Special / Super | `L` / `U` | `L` emergency attack |
| Throw / Burst | `I` / `O` | `I` throw, `K` jump |
| 2P | Arrows + `N` `M` `,` `.` `/` `;` | — |
| Common | `H` command list, `ESC` pause, `Q` (while paused) back | |

## Tech / 技術

- HTML5 Canvas 2D, fixed 60 Hz simulation, 1280×720 logical resolution, deterministic rendering (drawing never consumes the combat RNG).
- Web Audio API: 8 original tracks and all sound effects are synthesized locally from 35 PCM sources; no external audio files.
- 432 generated pixel-art poses (18 atlases) and 4 panoramic backgrounds embedded as data URIs.
- Character voices: VOICEVOX synthesized clips (see credits).
- No server, no network requests, no installation. Open `ai_studio_code.html` directly.

## Repository layout / 構成

```
ai_studio_code.html     the game (distributable). Header comment = full spec & changelog (Japanese)
index.html              GitHub Pages landing page
assets/                 editable sources that get embedded by the build
  sprites/              atlases (PNG), renderer.js, throws.js, prompts
  stages/               backgrounds (PNG), renderer.js
  voices/               WAV clips, engine.js, manifests, CREDITS.md
  audio/                SoundEngine source (engine.js) + README
  belt/                 NEON UPRISING source (engine.js) + README
tools/                  build-sprites.mjs (re-embeds assets), verify-*.cjs (Playwright tests), voice generation scripts
verification/           latest test reports and screenshots
```

Build: `node tools/build-sprites.mjs` re-embeds everything between the `SPRITE_ASSETS` / `AUDIO_ENGINE` / `BELT_ENGINE` markers. Never edit inside the markers by hand.
Tests: `node tools/verify-*.cjs` (needs Playwright and Chrome; see `assets/belt/README.md`).

The detailed design document and the per-version changelog (v1.1 → v2.2) live in the HTML comment at the top of `ai_studio_code.html`.

## Credits / クレジット

Character voices are synthesized with VOICEVOX. If you reuse the audio, keep the credits and follow each voice's terms.
キャラクターボイスは VOICEVOX による合成音声です。再利用時はクレジットと各音源の規約を引き継いでください。

| Character | Credit |
|---|---|
| 神楽 / KAGURA | VOICEVOX:玄野武宏 |
| ヴォルト / VOLT | VOICEVOX:白上虎太郎 |
| フレイヤ / FREYA | VOICEVOX:四国めたん |
| タイタン / TITAN | VOICEVOX:麒ヶ島宗麟 |
| 綾女 / AYAME | VOICEVOX:中国うさぎ |
| セリーヌ / CELINE | VOICEVOX:九州そら |

Terms: [VOICEVOX](https://voicevox.hiroshiba.jp/term/) / [玄野武宏・白上虎太郎・麒ヶ島宗麟](https://www.virvoxproject.com/voicevoxの利用規約) / [四国めたん・中国うさぎ・九州そら](https://zunko.jp/con_ongen_kiyaku.html). See also `assets/voices/CREDITS.md`.
