# Arcade Soundtrack & Sound Engine / v3.6.0

`engine.js` が現行 `SoundEngine` の編集元（v3.4.2で上昇技・炎のSEを5種追加。BGM楽曲は維持）。`node tools/build-sprites.mjs` で `ai_studio_code.html` の `AUDIO_ENGINE` 領域に反映する。
配布物は `ai_studio_code.html` ＋ `data/*.js`（11 パック）。
復元用に `ai_studio_code.v3.1.0.backup.html`、`ai_studio_code.v3.0.0.backup.html`、`assets/audio/engine.v3.0.0.js`（および旧版 `v2.6.0` / `v2.5.0` / `v2.4.0` / `v2.3.1` / `v2.0.0` バックアップ）を保存している。

## v3.5.0 重量感のある打撃

`synthImpactBody`で`impactBody`/`impactCrush`を追加（バンク42音）。通常・強打・斬撃・上昇技・炎命中・投げ着地に低音と短い残響を重ねます。強打は43Hzへ落ちる衝撃と長めの減衰で迫力を補強。既存SEバスとリミッターを共用。`tools/verify-weight-v350.cjs`で変更前後の低域量、波形ピーク、SE消音、追加台詞8本の実再生を検証します。

## v3.4.2 専用アクションSE

`synthArcadeAction` が `rising0/1/2`（3打撃）、`fireLaunch`（炎突進）、`fireHit`（炎上命中）を固定シードで合成します。サンプルバンクは35→40。`playRising` / `playFlame` から既存SEバスへ送るため、音量・ミュート・音声優先処理を共用します。音響波形の検証と5秒試聴ファイルは `verification/actions-v342/`、検証スクリプトは `tools/verify-actions-v342.cjs`。

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
- 21種の効果音バッファ（`punch0..2, heavy0..2, slash0..2, metal0..2, wood0..2, swing, swingHeavy, catch, landing, energy, reverse`）と手続き合成レイヤーを全面刷新。v3.1.0 では打撃音の爽快感を極大化するため、全打撃・斬撃・破壊・投げ・超必殺SEに多段FMウィップクラック（6.8kHz→420Hz指数スイープ）、デュアルオシレーターFMによる骨砕きグロウル（520Hz→110Hz）、地響きサブベース（260Hz→36Hz）、6モード・ダマスカス鋼レゾナンス（820Hz〜7.15kHz）、ヒットスパーク多重倍音（1.8k/3.4k/5.1k/7.2kHz）およびステレオ・マルチレイヤー演出（`playHit / playGrapple / playSuper / playBreak`）を導入。
- `seGain` を 0.82 に調整し、BGMや新キャラクターボイスとの理想的なアーケード音圧バランスを確立。
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

### v3.6.1

- `sample()` は効果音が上限 32 に達すると、最も古い効果音を `steal()` で数 ms かけて消し、新しい音を必ず鳴らす（以前は新しい音を捨てていた）。`stats.stolen` に回数。`verify-audio` の負荷テストが「破棄 0 回」を検査。
- 通常打撃の `impactBody` は胴鳴り 46Hz・減衰 9.5（v3.6.0 は 53Hz・12）。punch0〜2 の帯域（56〜69Hz）と重なって低域が打ち消される組み合わせがあったため。`verify-weight-v350` が全 18 通りで低域の増加を検査。

### v3.6.0

impactBody/impactCrush: 広帯域クラック、降下する胴鳴り、34/43Hzサブ、短い残響。既存マスター/音量/リミッターを維持。旧3.5比較と試聴は verification/stage2-v360/audio-report.json / impact-old-new.wav。
