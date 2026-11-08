# Arcade soundtrack / v2.1.0

`engine.js`が現行SoundEngineの編集元。`node tools/build-sprites.mjs`でHTMLのAUDIO_ENGINE領域に反映する。
配布物は従来どおり`ai_studio_code.html`のみ。既存のキャラクターボイス126本は変更していない。
復元用に`ai_studio_code.v2.0.0.backup.html`と`assets/audio/engine.v2.0.js`を保存している。

## 曲と編集箇所

| ID | 曲 | BPM | 場面 |
|---|---|---:|---|
| 0 | NIGHT SIGNAL | 108 | メニュー |
| 1 | CRIMSON IGNITION | 164 | 古城 |
| 2 | NEON CIRCUIT | 142 | 電脳都市 |
| 3 | FROZEN CROWN | 128 | 聖堂 |
| 4 | AMBER RUN | 122 | 港 |
| 5 | BLACK VEIN / AFTER DARK | 112 | ベルトスクロールの街 |
| 6 | IRON REIGN | 156 | IRON VOSS戦 |
| 7 | BREAK THE DAWN | 126 | 両ゲームのクリア |

全曲32小節・16分音符512ステップ。`ARCADE_TRACKS`でテンポ、4つのルート音、和音の長短、音色、スウィングを指定。
`score(track, step)`は音符・ドラムイベントを返す純粋関数。導入、主旋律、ブレイク、再展開、フィルを管理する。
`tick`は譜面を音声ノードに変換し、`schedule`が25ms間隔・120ms先読みで予約する。
音楽の時計はAudioContext、ゲームの時計は従来の固定60Hz。戦闘フレームから音符の長さを決めない。

## 音色・効果音

`buildBank`は35個のPCM音源を一度生成する。7種の打楽器、7種の楽器、15個の衝撃音バリエーション、6種の風切り・接触・エネルギー音。
FM・倍音合成・ノイズ・自然減衰・飽和を用いたオリジナルの合成音色であり、楽器を生録音した素材ではない。
サンプル生成は22,050Hz、実再生ではAudioBufferSourceがデバイスレートへ変換する。
Convolverの応答だけは必ず`ctx.sampleRate`で作る（異なるレートの応答を直接渡さない）。

旧API `playUI / playSwing / playHit / playGrapple / playSuper / announce`は維持。
新規に`playBreak(material) / playPickup(type) / playCue(type)`を追加した。
全効果音はseGainへ送り、音楽用kickを投げに流用しない。木箱・缶・パイプ・食料・現金で音を分ける。
`announce`はラウンド開始等の短いジングル。旧ブラウザTTSによる読み上げは使わず、画面バナーを維持。
音色の乱数は独立xorshiftを使用し、ゲームのMath.randomを変更・消費しない。

## ミックスと管理

- BGM: トラック別バス → bgmGain → 2.3kHz付近の軽い減衰 → 高域シェルフ → comp。
- リバーブ: トラック別バス → 短いステレオ応答 → wet → bgmGain。
- SE: seGain → comp。声: 既存FighterVoiceBank.gain → comp。
- 最終: comp → limiter → master → デバイス出力。
- 声がある間は音楽を約48%に下げ、戻りは220ms。VOICE音量と既存優先度は維持。
- 同時音数は音楽72、SE32。各イベントの連打を抑制し、onendedですべての一時ノードを切断。
- 曲切替では古いバスをフェードし、予約音も停止。古いバスは200ms後に切断する。
- メインタブの復帰・予約遅れでは過去の音符をまとめて鳴らさない。ミュート中も拍の時計は進む。

## 検証・試聴

`node tools/verify-audio.cjs`はChrome/Playwrightを使い、8曲すべての32小節を実レンダリングする。
各小節のRMS、全体ピーク、有限性、左右の差、譜面の相違、音声ノードの終了を確認する。
効果音、音量の分離、声によるダッキング、切替、予約復旧、消音、連打時の負荷も検査する。
レポートは`verification/audio/report.json`。

同フォルダーのmenu-preview.wav、black-vein-preview.wav、boss-preview.wavは各18秒の主旋律部分。
これらは確認用書き出しであり、HTMLに追加しない。計測と主観的な実聴評価は区別する。

従来動作はverify-sprites.cjs、verify-throws.cjs、verify-belt.cjs、verify-voice-update.cjsで検証する。
Playwrightの場所は`C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`。

## v2.2.0 の変更

- `sound.prebuild()` をページ読み込み 400ms 後に呼ぶ（HTML 末尾）。OfflineAudioContext を使って 35 音源を `setTimeout` で 8ms ずつ分割生成し、
  `fighterVoice.preload()` で 126 本のボイスも先に復号する。AudioContext 自体は自動再生制限のため従来どおり最初の操作で作る。
- `buildBank(context, deferred)` は `context.createBuffer` だけを使うので、生成した AudioBuffer は実コンテキストでそのまま再生できる。
  `attach()` は未完了分を `flushBank()` で同期的に仕上げる。`verify-audio.cjs` のように新しい `SoundEngine` に `attach(offline)` した場合は従来どおり同期生成。
- 効果: 初回操作時の `sound.init()` が約 350ms → 約 50ms。
- 書式は Prettier（printWidth 120 / singleQuote / trailingComma none / LF）。
