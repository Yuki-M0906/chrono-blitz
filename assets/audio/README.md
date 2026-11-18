# Arcade Soundtrack & Sound Engine / v3.9.0

`engine.js` が現行 `SoundEngine` の編集元（v3.9.0 で全8曲 BGM を「生音の演奏」による交響曲・聖堂音楽へ全面刷新。既存 SE 42 音は完全維持）。`node tools/build-sprites.mjs` で `ai_studio_code.html` の `AUDIO_ENGINE` 領域に反映する。
配布物は `ai_studio_code.html` ＋ `data/*.js`（13 パック）。
復元用に `assets/audio/engine.v3.8.0.js`、`ai_studio_code.v3.8.0.backup.html`（および旧版バックップ）を保存している。

## v3.9.0 生演奏シンフォニー・大聖堂音楽刷新

- 従来のノコギリ波・矩形波オシレータ主体（いわゆるピコピコ音）を廃止し、物理・共鳴モデリングによる **13種のオーケストラ／聖堂生楽器** と **音程付きティンパニ＋生打楽器群**、さらに左右非対称の初期反射音と空気吸収を備えた **2.25秒ステレオ・シンフォニーホール残響（`impulse(2.25)`）** へ全面刷新。
- 音楽同時発音上限を `72 → 128` へ拡張し、豊かな和声の余韻とダイナミックレンジを確保。
- 既存 SE バンク（`this.bank` 42 音：打撃・斬撃・重撃・上昇技・炎・`impactBody` / `impactCrush` 等）および `play*` API・48% ボイスダッキングは一切不変。

## 曲と編集箇所（全8曲・完全独立交響楽／聖堂編成）

| ID | 曲 | BPM | 調・旋法 | 編成・場面 |
|---|---|---:|---|---|
| 0 | NIGHT SIGNAL | 84 | D Aeolian | メニュー大序曲（グランドピアノ・弦楽・ホルン・ティンパニ） |
| 1 | CRIMSON IGNITION | 102 | E Aeolian | 古城（木管フルート・ハープ・弦楽・大太鼓・和太鼓の武士道交響曲） |
| 2 | NEON CIRCUIT | 112 | A Aeolian | 都市決戦（跳弓スピッカート弦・ピアノ・トランペット・ティンパニ） |
| 3 | FROZEN CROWN | 80 | F# Aeolian | 氷聖堂（16'+8'+4' パイプオルガン・SATB聖歌隊・ハープ・鐘） |
| 4 | AMBER RUN | 96 | G Dorian | 港（クラシックギター・ホルン・弦楽・ティンパニの叙情曲） |
| 5 | BLACK VEIN / AFTER DARK | 90 | C# Aeolian | 犯罪都市ベルト本編（チェロ／コントラバス・ピアノ・低金管の夜想曲） |
| 6 | IRON REIGN | 104 | C Aeolian | ボス戦（聖歌隊・オルガン・重金管・スピッカート・小太鼓＆シンバルの鎮魂曲） |
| 7 | BREAK THE DAWN | 94 | D Major | クリア（戴冠式トランペット＆ホルン・合唱・鐘・全合奏ファンファーレ） |

- 全曲32小節・16分音符512ステップ。`ARCADE_TRACKS` / `TRACK_COMPOSITIONS` により10度＋5度＋9度のオープンボイシングと導入→主題→副主題→クライマックス構成で演奏。
- 音楽の時計は `AudioContext`、ゲームの時計は従来の固定60Hz。戦闘フレームから音符の長さを決めない。

## マルチサンプル音色・効果音（Foley）

- `buildBank` は 42 個の共通 PCM 音源（`this.bank`）に加え、計 **131 個** の音域別オーケストラ／打楽器マルチサンプル（`this.noteBank`）を生成する：
  - **オーケストラ・聖堂音色 13 種（計 99 音域別）**: `strings` (9音域, 6人合奏), `lowStrings` (7音域, チェロ+コントラバス), `spiccato` (6音域), `horn` (7音域, 4本), `trumpet` (7音域, 3本), `lowBrass` (6音域, トロンボーン+チューバ), `piano` (12音域, 非調和性弦+3弦ユニゾン), `harp` (8音域), `choir` (8音域, 7人F1/F2/F3フォルマント合唱), `organ` (9音域, 16'+8'+4'+チフ+トレムラント), `wind` (6音域), `acguitar` (8音域), `chimes` (6音域, モーダル管鐘)
  - **ティンパニ＆生打楽器 13 種**: `timpani:36..54` (7音程), `orch:grancassa / orchsnare / orchsnare_soft / piatti / cymbal_swell / taiko` (6種)
  - **レガシー互換用 19 音域**: `bass` (5音域), `keys` (7音域), `bell` (7音域)
- 上記オーケストラ音源と並行して、既存効果音 42 音（`punch/heavy/slash/wood/metal/swing/catch/landing/energy/reverse/rising/fire/impactBody/impactCrush` 等）を完全保持。

## ミックスと管理

- BGM: トラック別バス → `bgmGain` → 2.5kHz付近のボーカル帯域ディップ (`musicEQ`) → 高域シェルフ (`musicHigh`) → `comp`。
- リバーブ: トラック別バス → ステレオ・アーリーリフレクション＋拡散テール応答 (`reverb`) → `wet` → `bgmGain`。
- SE: `seGain` → `comp`。声: `FighterVoiceBank.gain` → `comp`。
- 最終: `comp` → `limiter` → `master` → デバイス出力。
- 声がある間は音楽を約48%にダッキングし、戻りは220ms。VOICE音量と既存優先度は維持。
- `sound.prebuild()` によりページ読み込み400ms後に `OfflineAudioContext` で `bank`（35個）と `noteBank`（47個）を8ms単位のアイドル分割ジョブで事前生成し、`adoptBank()` で実コンテキストへ引き継ぐ。

## 検証・試聴

`node tools/verify-audio.cjs` は Chrome / Playwright を使い、8曲すべての32小節を実レンダリングして各小節のRMS、全体ピーク、有限性、左右の差、譜面の相違、音声ノードの終了、効果音、音量分離、ダッキング、曲切替、予約復旧、消音、連打時の負荷を検査する（レポート: `verification/audio/report.json`、試聴用18秒WAV: `verification/audio/menu-preview.wav`, `black-vein-preview.wav`, `boss-preview.wav`）。

### v3.6.1

- `sample()` は効果音が上限 32 に達すると、最も古い効果音を `steal()` で数 ms かけて消し、新しい音を必ず鳴らす（以前は新しい音を捨てていた）。`stats.stolen` に回数。`verify-audio` の負荷テストが「破棄 0 回」を検査。
- 通常打撃の `impactBody` は胴鳴り 46Hz・減衰 9.5（v3.6.0 は 53Hz・12）。punch0〜2 の帯域（56〜69Hz）と重なって低域が打ち消される組み合わせがあったため。`verify-weight-v350` が全 18 通りで低域の増加を検査。

### v3.6.0

impactBody/impactCrush: 広帯域クラック、降下する胴鳴り、34/43Hzサブ、短い残響。既存マスター/音量/リミッターを維持。旧3.5比較と試聴は verification/stage2-v360/audio-report.json / impact-old-new.wav。
