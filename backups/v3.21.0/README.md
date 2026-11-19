# CHRONO BLITZ: ARCADE COLLECTION

Browser-only arcade collection (one small HTML file plus a `data/` folder of asset packs): the 1-on-1 2D fighter **OVERDRIVE** and the side-scrolling beat 'em up **NEON UPRISING**. / HTML と `data/` フォルダで動くアーケードコレクション。2D 対戦格闘「OVERDRIVE」と 1 人用ベルトスクロールアクション「NEON UPRISING」。

**▶ Play the demo / デモをプレイ:** https://yuki-m0906.github.io/chrono-blitz/

Current version: **v3.21.0** / 現在のバージョン: **v3.21.0**

> v3.21.0: 主人公 6 人の歩行と走行を、新しく描いた専用の 8 コマ＋8 コマへ切り替え（ベルト側。同じ絵を使う色違いの敵も同じ）。歩く速さに足運びを合わせ、足の滑りを抑えた。専用の絵を持つ敵 8 体（海辺の敵、双子、ボス 3 体）の歩行も 8 コマへ切り替えた。

> v3.20.2: ベルト側の歩行を修正。大きさの違う絵が混ざって脚がばたつき、体が伸び縮みしていたのを、揃った 4 コマを自然な速さで回す形に変更（主人公 6 人、同じ絵を使う敵、IRON VOSS）。移動速度と当たり判定は変更なし。

> v3.20.1: ベルト側のキャラクターの動きを点検し、コマごとの体の位置ずれを描画時に補正（海辺の敵の構え・攻撃・被弾で胴体が横へ飛ぶ、セリーヌの歩行が左右に揺れる、タイタンの足元が上下する）。当たり判定・威力・画像は変更なし。古くなっていた検査 8 本と資料を同期。英語音声 142 本を、配布条件のはっきりしたローカル生成（Kokoro-82M、Apache-2.0）へ差し替え。

> 第5面は鉄道高架から時計塔・通信設備・雲の層まで上昇。VESPERに新規36姿勢と専用の叫び声6種を追加し、巻上機の走行音を刷新しました。

> 第5面のボス VESPER MATRIARCH を16姿勢の専用原画に刷新。建物の窓を追い越し、屋上から港の全景が開けるまで、高度に合わせて景色が変化します。巻上機の重い軸音と歯車の響きはSE音量で調整できます。

> 第5面は夕陽を受ける鉄骨の張り出し足場と巻上機を追加し、専用曲「REDLINE RIG」（156 BPM）で上昇。ボーナスのGTは左右それぞれ6段階で壊れます。矢印で車の手前か奥を回り、両側から攻撃してください。

> 第5面に夕景の工事現場の原画と控えめな巻上機音を追加。ゲーム選択右下の「BONUS  BREAKER YARD」から車破壊ボーナスを直接開始できます。

> 車破壊ボーナスの次は第5面 SKYHOOK ASCENT。上昇する建設用リフトで4波の降下部隊と、硫酸・尾払い・突進を使う巨大エイリアンに挑む。

> ステージ4クリア後は車破壊ボーナス「BREAKER YARD」。J / Z で中央のクーペを攻撃。完全破壊で PERFECT、45秒以内は残り時間に応じて加点。

> v3.15.1: 歩幅と後退姿勢を実移動に合わせ、残像・技表中の停止・60Hz再生を修正。海辺の追加衣装色はロード時に準備。

> v3.15.0: ステージ3の追加24姿勢を、待機・歩行・走行・攻撃・被弾・起きのそれぞれの長さで全部出すように組み直した。歩行と待機は胴の中心を揃え、歩き始めから一歩ずつ進む。戦闘の威力と受付は従来どおり。

> v3.14.0: ステージ3の追加姿勢を、同じ役割のまま描き直した。待機と歩行、攻撃、被弾の重心が腰と胸の曲線で読める。衣装の範囲、武器、コマの役割、戦闘の威力と受付は従来どおり。

> v3.13.0: ステージ3の追加姿勢を、歩き・攻撃・被弾・起き上がりの長さと等身に合わせた。絵の描き直しはなし。戦闘の威力と受付は従来どおり。

> v3.12.0: ステージ3のキャラクターに、表情・歩行・攻撃・被弾の追加24姿勢。色替え3体は同じ絵を衣装色だけ変えて使う。戦闘のタイミングは従来どおり。

> v3.11.1: ステージ3の背景・床・人物の座標を統一し、滑らかなカメラ追従と全4区画の歩行・暗転接続を修正。

> v3.11.0: 地下鉄の入線・開扉・乗車を新規制作。ステージ4を9600pxの横スクロールへ拡張し、全区画の接続を移動演出へ統一。背景5枚と運転席を描き直し、地下鉄敵を96配色へ増加。

> v3.10.1: 列車を線路へ配置し入線時の画面揺れを強化。背景接続・運転席縮尺・闘技場の床を修正。英語看板・観客4コマ・歓声と拍手を追加。地下鉄敵の出現時画像処理を撤去し、肌と輪郭を保った衣装色違いへ変更。

> v3.10.0: 海辺の背景継ぎ目を修正。ステージ4 DEADLINE EXPRESS追加。列車到着・乗車・緊急停車、24色違い敵、地下闘技場と甲冑巨漢ボス。

> v3.9.0: 全8曲 BGM を従来のピコピコ音から「生音の演奏」による壮大で荘厳なフルオーケストラ／聖堂音楽へ全面刷新。弦楽合奏・ホルン・トランペット・重金管・SATB聖歌隊・パイプオルガン・グランドピアノ・ハープ・木管・クラシックギター・チューブラーベル・ティンパニ等の生音物理／共鳴モデル（131マルチサンプル）と2.25秒ホールコンボリューション残響を新設し全8曲を再作曲。ゲーム機構・英語音声・グラフィック・SEは v3.8.0 から不変。

> v3.8.0: 全142キャラクター＆ボス音声を英語の演劇的演技ボイスへ全面刷新。棒読みを排し「芝居がかった掛け合い・2段階超必殺・NCC-PSOLA気合/被弾抑揚・Titan/Voss胸部サブ倍音・Furnace Maw怪物多重咆哮・スタジオマスタリング」を構築。ゲーム進行・当たり判定・画像・BGM/SEは v3.7.2 から不変。

> v3.7.2: 総合チェックに基づく整合修正。色違いの敵が初登場する瞬間の引っかかり（約0.1秒）を解消。読み込み総量の数値、技表（上昇技の受付・ステージ3・開始ステージ選択）、冒頭の構成サマリを同期。ステージ選択の検査を追加し、検証は全23本。ゲームの戦闘・進行は v3.7.1 と同じ。

> v3.7.1: ゲーム選択画面右下の小さなボタンから、ベルトアクションの開始ステージを選択可能。ステージ3のキャラクターデザインを微調整済み（機構は同じ）。再開メモは `assets/belt/art/resort-v370/HANDOFF-design.md`。

> v3.7.0: ステージ3「AZURE MIRAGE」を追加。真昼の海辺リゾート5区画、動く水面・ヤシ・旗・カモメ、専用水着女性敵6種50体、武器連携を使う双子ボス「ルカとミーシャ」。ステージ2クリア後Enterで進行。

> v3.6.2: 全6人の上昇技を通常原画の等身へ統一。下→上受付14F。MAWに72追加姿勢・大火炎放射・被弾モーションを追加。

> v3.6.1: 案内ページ・README・技表・冒頭の構成サマリを v3.6 の内容（ステージ2、136音声、3段上昇技）に同期。古い期待値で止まっていた検証6本を修正し、全20本が通過。連打時に打撃音が抜ける問題と、通常打撃の低音が打ち消される問題を修正。ステージ2の曲選択を修正。

> v3.6.0: 残り4人の上昇技の等身を修正。打撃音の鋭さと重低音を強化。ステージ2「INFERNAL WORKS」（廃工場5区画）と巨大怪物FURNACE MAWを追加。ステージ1クリア後Enterで進行。

> v3.5.0: 色違い雑魚敵を9種類へ増加。打撃音の低域と残響を強化。ボス登場の悪役台詞、撃破スローモーションと絶叫、全6人の専用決め台詞を追加。

> v3.4.4: 待機時の不自然な体格変化を撤去。炎上ダウン画像に隣コマが混入する不具合を修正し、KAGURAの上昇技24コマを通常体型へ合わせて再制作。

> v3.4.3: TITAN上昇技の頭身を通常絵に合わせて再制作。炎上方向を修正し、敵名・体力をプレイヤーゲージ下へ固定表示。HUDの枠・目盛り・ダメージ残像を刷新。

> v3.4.2: 3段上昇技の専用画像144姿勢・打撃音3種、炎ダッシュと全身炎上画像・炎音2種、掴み判定拡大、前方投げと巻き込みを追加。詳細はHTML冒頭コメント。

> v3.3.0: 全6人・雑魚敵・IRON VOSSのデザインを全面刷新。顔・髪型・衣装を洗練された現代アニメ調へ更新し、両ゲームの通常/投げ/ダッシュ全27枚648姿勢へ展開。3.2.0の音声・音楽・効果音・ゲーム性を維持。生成基準と引き継ぎは `assets/characters/v33/HANDOFF.md`。

> v3.2.0: キャラクター音声全126本の棒読みをさらに徹底改善（AquesTalkかなアクセント精密制御、`intonation_scale=1.0`＋プラトー打破プロソディ造形、4モーラ以上の無歪みHiFi-GAN化と短気合いNCC-PSOLA適用、キャラ別VOICEVOX演技スタイル最適化）。SE・BGM・セルアニメ画像・ゲーム性はv3.1.0から維持。

> v3.0.0: 全6人・雑魚敵・ボスをセルアニメ調へ刷新。通常・必殺技・投げ・ダッシュの27枚648姿勢を描き直し、キャラクター表示を約15％拡大しました。両ゲームの戦闘仕様と2.8.1の起動時BGM修正を維持しています。詳細な引き継ぎはHTML冒頭コメント、生成資料は `assets/characters/v3/prompts.json`、検証は `node tools/verify-anime.cjs`。

> The game is `ai_studio_code.html` (about 0.7 MB) plus sixteen asset packs in `data/` (about 300 MiB total). Keep them together. Later loads are cached per pack. Keyboard required.
> ゲーム本体は `ai_studio_code.html`（約0.7MB）と `data/` フォルダのアセットパック16本（計約300MiB）のセットです。必ず同じ場所に置いてください。初回読み込みには時間がかかります。キーボードが必要です。
>
> v2.8.1: 起動直後のゲーム選択画面で音楽が鳴らない問題を修正。ブラウザは操作があるまで音を出せないため、最初のクリック / キー押下を「スタート」として受け、そこで音楽を始めます。 / The first click or key press now starts the game select screen and its music.
>
> v2.8.0: NEON UPRISING に前方向2回のダッシュと、走行中 J / Z の強力なダッシュ攻撃を追加。命中するとボスのアーマーも貫通して必ずダウン。6人専用の走行・攻撃・復帰144姿勢を追加し、2.7.0の音声・音楽・効果音と従来素材は保持。
>
> v2.7.0: キャラクター音声（全 6 人・126 クリップ）の棒読みを解消（音節構造に基づくアクセント・抑揚拡大、時変 F0 演技コンター、誤読・平板発声の修正）し、打撃・斬撃・投げ・必殺技などの効果音（SE）を爽快感のある重厚なアーケードサウンドへ刷新。
>
> v2.6.0: NEON UPRISING の当たり判定を遊びやすく調整（攻撃の奥行きと持続を拡大、敵の攻撃は避けやすく）。単一 HTML を分割して読み込みを改善。

v2.5.0: NEON UPRISING の全 5 区画を描き下ろし背景へ刷新。木箱・ドラム缶・拾得品・鉄パイプに専用ドット絵を追加し、IRON VOSS を 72 姿勢のオリジナルボスへ変更。v2.4.0 のゲーム機能と音響は維持しています。

## Games / 収録ゲーム

| | OVERDRIVE | NEON UPRISING |
|---|---|---|
| Genre | 1-on-1 versus fighting | Side-scrolling beat 'em up (1 player) |
| Content | 6 fighters, 4 stages, ARCADE / VS CPU / VS 2P / TRAINING | 5 stages and a bonus round: "BLACK VEIN" (boss IRON VOSS) → "INFERNAL WORKS" (giant monster FURNACE MAW) → "AZURE MIRAGE" (twins LUKA & MISHA) → "DEADLINE EXPRESS" (OSWALD / IRON SHOGUN) → bonus "BREAKER YARD" (wreck a car) → "SKYHOOK ASCENT" (a rising hoist, boss VESPER MATRIARCH). 9 city enemy types, 6 resort types and 96 metro variants. Score and lives carry over |
| Systems | Gatling cancels, command-input bonus, just guard, drive burst, synchronized throws | Final Fight style chain (punch → body blow → uppercut, each stage only after a hit), hold ↓ on the third hit to throw instead, thrown bodies hit other enemies, grabs with follow-up strikes, three-hit rising attack (↓ → ↑), flame dash attack, emergency spin attack, breakables and pickups, lives and 1UP, boss intro lines and slow-motion finish |

## Controls / 操作

| | 1P (OVERDRIVE) | NEON UPRISING |
|---|---|---|
| Move | `W` `A` `S` `D` (or arrows) | `W` `A` `S` `D` (up/down = depth) |
| Dash / Dash attack | Forward twice / Back twice | `→→` / `←←` / `D D` / `A A`, hold the second press to run; `J` / `Z` while running to attack |
| Light / Heavy | `J` / `K` | `J` chain attack (punch → body → upper) and pick up; hold `S` on the 3rd hit to throw |
| Special / Super | `L` / `U` | `L` emergency attack; `S` → `W` (↓ → ↑) three-hit rising attack |
| Throw / Burst | `I` / `O` | `I` throw, `K` jump |
| 2P | Arrows + `N` `M` `,` `.` `/` `;` | — |
| Common | `H` command list, `ESC` pause, `Q` (while paused) back | |
| Start stage | — | Button at the bottom right of the game select screen ("ベルト開始：STAGE n"), then pick a hero |

## Tech / 技術

- HTML5 Canvas 2D, fixed 60 Hz simulation, 1280×720 logical resolution, deterministic rendering (drawing never consumes the combat RNG).
- Web Audio API: 9 original tracks (8 orchestral / cathedral pieces and the stage 5 theme) and all sound effects are synthesized locally from 42 base PCM buffers + 131 multi-sampled acoustic instrument and orchestral percussion buffers with a 2.25s stereo symphony hall convolver; no external audio files.
- 432 shared contemporary anime poses (18 atlases), 72 IRON VOSS poses (3), 144 dash poses (6), a 24-cell rising-attack effect atlas, 96 FURNACE MAW poses (4) with a 12-cell flame, a 24-cell fire atlas, 4 versus backgrounds, 15 street / factory / resort backgrounds, 3 resort enemy atlases, 4 twin-boss atlases (96 poses), a resort decor atlas and an 8-cell prop/item atlas stored as data URIs (62 PNGs total).
- Character voices: 148 clips. 142 English lines (22 per fighter including a finishing line; intro / defeat for VOSS and MAW; intro / combo / defeat for each twin) synthesized locally with the open-source Kokoro-82M model and post-processed, plus 6 creature sounds for VESPER synthesized from scratch (see credits).
- No server, no network requests, no installation. Open `ai_studio_code.html` directly (with `data/` beside it).

## Repository layout / 構成

```
ai_studio_code.html     the game code (distributable). Header comment = full spec & changelog (Japanese)
data/                   asset packs generated by the build (sprites, stages, voices, belt art as data URIs)
index.html              GitHub Pages landing page
assets/                 editable sources that get embedded by the build
  sprites/              atlases (PNG), renderer.js, throws.js, prompts
  stages/               backgrounds (PNG), renderer.js
  voices/               WAV clips, engine.js, manifests, CREDITS.md
  audio/                SoundEngine source (engine.js) + README
  belt/                 NEON UPRISING source (engine.js), visual layer (art.js), art/ PNGs + manifest/prompts, README
tools/                  build-sprites.mjs (re-embeds assets), verify-*.cjs (Playwright tests), voice generation scripts
verification/           latest test reports (JSON). Screenshots and audio previews are generated locally by the tests and not committed
backups/                pre-change copies of edited sources for recent versions (two tests read them)
```

Not committed (kept only on the author's machine, see `.gitignore`): test screenshots, superseded artwork that the build no longer reads (pixel-art atlases, `anime-v3`), and per-version full HTML backups. Three tests compare against such local files and skip or fail on a fresh clone: `verify-sprites` (v1.6.0 baseline), `verify-voice-update` (older voice sets) and part of `verify-anime`.

Build: `node tools/build-sprites.mjs` re-embeds everything between the `SPRITE_ASSETS` / `AUDIO_ENGINE` / `BELT_ENGINE` markers. Never edit inside the markers by hand.
Tests: `node tools/verify-*.cjs` (needs Playwright and Chrome; see `assets/belt/README.md`).

The detailed design document and the per-version changelog (v1.1 → v3.6) live in the HTML comment at the top of `ai_studio_code.html`.

## Credits / クレジット

Since v3.20.1 the character voices are English lines synthesized on the author's machine with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (model: Apache-2.0; runtime `kokoro-onnx`: MIT) by `tools/generate-english-voices.py`, then pitch-shaped and mastered by the same script. VESPER's six creature sounds are original synthesis (`tools/render-vesper-voices.mjs`).
v3.20.1 以降のキャラクターボイスは、オープンソースの音声合成モデル Kokoro-82M（Apache-2.0）でローカル生成し、同じスクリプトで演出用の加工をした英語の台詞です。VESPER の 6 本は独自合成です。

| Character | Credit |
|---|---|
| 神楽 / KAGURA | Kokoro-82M (am_fenrir) |
| ヴォルト / VOLT | Kokoro-82M (am_puck) |
| フレイヤ / FREYA | Kokoro-82M (af_bella) |
| タイタン / TITAN | Kokoro-82M (bm_george) |
| 綾女 / AYAME | Kokoro-82M (af_heart) |
| セリーヌ / CELINE | Kokoro-82M (bf_emma) |
| IRON VOSS | Kokoro-82M (am_michael) |
| FURNACE MAW | Kokoro-82M (am_michael) |
| ルカ / LUKA | Kokoro-82M (af_sarah) |
| ミーシャ / MISHA | Kokoro-82M (bf_isabella) |
| VESPER MATRIARCH | Original synthesized creature vocals |

History: v3.8.0–v3.20.0 used voices generated through the Edge read-aloud endpoint; they were replaced because their redistribution terms could not be confirmed. Up to v3.7.2 the voices were VOICEVOX (玄野武宏, 白上虎太郎, 四国めたん, 麒ヶ島宗麟, 中国うさぎ, 九州そら); those clips remain in the git history.

### v3.4.0 Street commands

↓→↑ / S→W within 14 frames of pressing down (holding down longer cancels it; a short overlap is allowed; 6-frame recovery buffer): three-hit rising attack, also from a grab. Grab: J/Z twice, then J/Z to launch or I to throw.
