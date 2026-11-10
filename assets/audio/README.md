# Arcade Soundtrack & Sound Engine / v2.7.0

`engine.js` が現行 `SoundEngine` の編集元。`node tools/build-sprites.mjs` で `ai_studio_code.html` の `AUDIO_ENGINE` 領域に反映する。
配布物は `ai_studio_code.html` ＋ `data/*.js`（10 パック）。
復元用に `ai_studio_code.v2.6.0.backup.html`、`assets/audio/engine.v2.6.0.js`（および旧版 `v2.5.0` / `v2.4.0` / `v2.3.1` / `v2.0.0` バックアップ）を保存している。

## 曲と編集箇所（全8曲・完全独立ダイアトニック編成）

| ID | 曲 | BPM | 調・旋法 | 場面 |
|---|---|---:|---|---|
| 0 | NIGHT SIGNAL | 108 | D Dorian | メニュー（シンセウェイヴ・アーケード導入） |
| 1 | CRIMSON IGNITION | 164 | E Aeolian | 古城（ドライヴ・ギター＆ブラス・ロック） |
| 2 | NEON CIRCUIT | 142 | F# Dorian | 電脳都市（サイバー・ファンク＆シンセリード） |
| 3 | FROZEN CROWN | 128 | F Aeolian | 聖堂（クリスタルFMベル＆ゴシック・パッド） |
| 4 | AMBER RUN | 122 | A Dorian | 港（アップビート・ブラス＆スラップベース・グルーヴ） |
| 5 | BLACK VEIN / AFTER DARK | 112 | C Dorian | ベルトスクロール市街（ダウンテンポ・ストリート・ファンク） |
| 6 | IRON REIGN | 156 | D Aeolian | IRON VOSS戦（インダストリアル・ボス・アンセム） |
| 7 | BREAK THE DAWN | 126 | G Dorian | 両ゲームのクリア（凱旋ファンファーレ） |

- 全曲32小節・16分音符512ステップ。`ARCADE_TRACKS` でテンポ、ルート、和音、主役音色、スウィングを指定。
- 旧版（v2.1〜v2.3.1）では `score(track, step)` が全8曲で同一の半音階オフセット配列を共有していたため、全曲が同じメロディに聞こえるうえ非ダイアトニックな音の衝突が発生していた。
- v2.4.0 では `TRACK_COMPOSITIONS` により8曲それぞれに固有の旋法（Aeolian / Dorian）、和音進行、ベースライン、アルペジオ、Aメロ (`leadA`)、Bメロ (`leadB`)、オブリガート (`counter`)、ドラムパターンを実装。
- `degreeToSemi(scale, deg)` により和音構成音とメロディ音程をすべて旋法内のダイアトニック度数で解決し、32小節（Intro / Verse / Chorus / Breakdown / Climax / Outro）を通じて不協和音のない明快なアーケード楽曲を実現。
- 音楽の時計は `AudioContext`、ゲームの時計は従来の固定60Hz。戦闘フレームから音符の長さを決めない。

## マルチサンプル音色・効果音（Foley）

- `buildBank` は35個の共通PCM音源（`this.bank`）に加え、7種の楽器を音域別にサンプリングした47個のマルチサンプル音色バンク（`this.noteBank`）を生成する：
  - `bass`: MIDI `[31, 36, 41, 46, 51]`（5音域）
  - `guitar, lead, keys, brass, pad, bell`: MIDI `[48, 54, 60, 66, 72, 78, 84]`（各7音域）
- 旧版では単一のC3/C4サンプルを `playbackRate` で最大±18半音伸縮していたため、エンベロープやビブラート速度が崩壊しエイリアシングノイズが発生していた。v2.4.0 では `note()` が最近傍のマルチサンプルを選択し、ピッチシフト幅を最大±3半音以内に抑えることで自然な倍音と減衰を維持する。
- 全楽器の合成に時変 State Variable Filter (`svf`)、ユニゾン・デチューン、FMベル倍音、ギター4×オーバーサンプリング・チューブ飽和＋キャビネットフィルタを採用。
- 21種の効果音バッファ（`punch0..2, heavy0..2, slash0..2, metal0..2, wood0..2, swing, swingHeavy, catch, landing, energy, reverse`）と手続き合成レイヤーを全面刷新。v2.7.0 ではさらに爽快感を高めるため、全打撃・斬撃・破壊・投げ・超必殺SEに高速FMアタック・トランジェント（ウィップクラック／ヒットスパーク倍音／2段ショックウェーブ／分散金属チャープ）とステレオ・マルチレイヤー演出（`playHit / playGrapple / playSuper / playBreak`）を導入。
- 公開API（`playUI / playSwing / playHit / playGrapple / playSuper / playBreak / playPickup / playCue / announce`）およびプロパティ契約は100%互換維持。
- 音色の乱数は独立xorshiftを使用し、ゲームの `Math.random` を一切変更・消費しない。

## ミックスと管理

- BGM: トラック別バス → `bgmGain` → 2.5kHz付近のボーカル帯域ディップ (`musicEQ`) → 高域シェルフ (`musicHigh`) → `comp`。
- リバーブ: トラック別バス → ステレオ・アーリーリフレクション＋拡散テール応答 (`reverb`) → `wet` → `bgmGain`。
- SE: `seGain` → `comp`。声: `FighterVoiceBank.gain` → `comp`。
- 最終: `comp` → `limiter` → `master` → デバイス出力。
- 声がある間は音楽を約48%にダッキングし、戻りは220ms。VOICE音量と既存優先度は維持。
- `sound.prebuild()` によりページ読み込み400ms後に `OfflineAudioContext` で `bank`（35個）と `noteBank`（47個）を8ms単位のアイドル分割ジョブで事前生成し、`adoptBank()` で実コンテキストへ引き継ぐ。

## 検証・試聴

`node tools/verify-audio.cjs` は Chrome / Playwright を使い、8曲すべての32小節を実レンダリングして各小節のRMS、全体ピーク、有限性、左右の差、譜面の相違、音声ノードの終了、効果音、音量分離、ダッキング、曲切替、予約復旧、消音、連打時の負荷を検査する（レポート: `verification/audio/report.json`、試聴用18秒WAV: `verification/audio/menu-preview.wav`, `black-vein-preview.wav`, `boss-preview.wav`）。
