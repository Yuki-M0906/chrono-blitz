# NEON UPRISING — Stage 1 & 2 / v3.6.1

## v3.6.1 整合修正

`ensureBGM()`（HTML 直書き）が街モードの曲を 5 番に決め打ちしていたのを `STREET_STAGES[].music` 参照へ修正。技表と HUD 下段に 3 段上昇技・掴み追撃・ステージ進行を追記。検証スクリプト 6 本を現行素材に合わせて更新（詳細は HTML 冒頭 [FIX-128]〜[DOC-130]）。ステージ 2 の説明は末尾「v3.6.0 — INFERNAL WORKS」。

## v3.5.0 敵9種・重厚打撃・ボス演出

`STREET.enemies` に色違い6種を追加。各敵の `role` は既存3種の戦闘・ドロップ仕様を継承します。第2区画以降の編成を更新。`beginFinale` / `updateFinale` は致命打後の1/4速落下、絶叫、6人別の決め台詞、クリアを管理します。音声の再生速度は変えず、実音声長に合わせて字幕と待ち時間を設定。ポーズで時計を停止し、再開時に該当台詞を再生します。新音声の生成指示と計測値は `../voices/cinematic-v350/report.json`。検証は `tools/verify-boss-v350.cjs` / `tools/verify-weight-v350.cjs`。

## v3.4.4 待機姿勢・炎上ダウン・KAGURA

共有レンダラーとボスのIDLEを基準コマへ固定し、体格が違う絵の循環による鼓動を撤去。`prepareAtlas`の`fx-fire`だけ元の256pxセルを厳密に切り出し、ダウン後半に上段の人物が混入する問題を解消。KAGURA上昇技は `art/actions-v344/kagura.png` に再制作。検証は `tools/verify-idle-fire-v344.cjs`、旧版の混入再現と修正版の比較結果は `verification/idle-fire-v344/`。

## v3.4.3 体型・炎上方向・固定HUD

TITAN上昇技は `art/actions-v343/titan.png`（通常絵を基準に再制作）。`burnDirection`で炎上絵を攻撃方向に反転します。敵の頭上ゲージは廃止し、プレイヤーの下に最後に命中/掴みを行った敵名・HPを表示。`trackHudTarget` / `trackHudHit` / `hudEnemy` が対象とダメージ残像を管理し、`drawHealth` / `hudPanel` / `drawHUD` が描画します。検証は `tools/verify-hud-v343.cjs`、画面とレポートは `verification/hud-v343/`。

## v3.4.2 上昇技・炎ダッシュ・前方投げ

専用画像は `art/actions-v342/`、生成ツールは built-in image_gen。上昇技6枚144姿勢と炎24コマを追加。専用SEは `../audio/engine.js` の `synthArcadeAction` で生成。掴み範囲・前方投げの仕様と復元方法はHTML冒頭を参照。`node tools/verify-actions-v342.cjs` で全6人の技・左右投げ・専用音を検証し、`verification/actions-v342/` に結果とプレビューを出力します。

## v3.3.0 全キャラクターデザイン刷新

新しいデザイン基準から全6人・色替え雑魚・VOSSの通常/補間/投げ/ダッシュ全姿勢を描き直しました。採用画像は `../sprites/design-v33/` と `art/design-v33/`。基準絵・生成プロンプト・3.2.0の比較基準は `../characters/v33/`。表示倍率・判定・戦闘処理・背景・音響は3.2.0を維持しています。

## v3.2.0 キャラクター音声棒読みさらなる徹底解消（音韻アクセント・無歪みプロソディ・演技スタイル最適化）

- キャラクター音声126本をVOICEVOXにて完全新規再生成。棒読みを徹底解消し、格闘ゲームに相応しい鋭い気合・演技プロソディ・F0ダイナミクス・24kHzスタジオマスタリングを適用。
- 打撃効果音（軽打撃・強打撃・ダッシュ攻撃・斬撃・破壊・掴み・着地）を多段FMウィップクラック＋骨砕きグロウル＋地響きサブベース＋多重ヒットスパーク倍音へ徹底刷新。
- セルアニメ調グラフィック、当たり判定、ダッシュ仕様、戦闘ロジック、背景は100%維持。

## v3.0.0 セルアニメ調キャラクター

全員の通常/投げ/ダッシュとVOSS全姿勢を描き直し、雑魚敵の色変えにも反映。新画像は共通 `../sprites/anime-v3/` と街専用 `art/anime-v3/`。`FighterSprites.prepareAtlas` が256px元画像を縮小せず384pxセル/64px余白へ転写し、`scaleFor` で旧表示の1.15倍に描画します。敵HPバーと攻撃予告の高さのみ調整し、戦闘処理は2.8.1のままです。背景・物体・音声・音響は変更していません。

生成資料は `../characters/v3/prompts.json`。旧画像/コードを保存し、復元方法と更新詳細をHTML冒頭に記載。`node tools/verify-anime.cjs` で全648姿勢と2.8.1ゲームロジックの一致を検証できます。以下は各旧版の履歴です。

`ai_studio_code.html`の起動メニューから選ぶ、1人用ベルトスクロールアクション。
既存の対戦ゲームは「OVERDRIVE」として同じメニューから起動する。

## v2.8.1 起動時のスタート待ち

- 起動直後の HUB は `game.awaitStart = true`。最初のクリック / キー押下（Escape・修飾キー以外）は選択や決定に使わず、スタートとして消費する。
  ブラウザは操作があるまで音を出せないため、この操作で HUB の BGM が始まる。`openHub()` で戻ったときは再表示しない。
- 待ち画面の描画は `stageTick` だけを参照し、状態・乱数・音声に触れない。検証は `node tools/verify-start.cjs`。

## v2.8.0 ダッシュとダッシュ攻撃

- `→→` / `←←` / `D D` / `A A` を14F以内に入力し、2回目を保持して走る。解除・逆入力・ゲートで停止し、ジャンプ/投げで通常操作へ戻る。長押しリピートでは発動しない。
- 走行中 `J` / `Z` で専用攻撃。素手114〜128ダメージ（通常の強攻撃の約1.65倍）、発生8F・持続8〜19F・全体38F。ボスの突進/床叩きアーマーを貫通し、有効命中は必ず吹き飛び→ダウン。無敵中など元から攻撃できない対象の条件は維持。
- 調整値は `STREET.dash`、操作は `readDashTap()` / `playerInput()`、技は `dashAttack()`。`STREET_DASH` / `DASH_ATTACK` は街のプレイヤー専用。走行中の自動掴みとアイテム拾いより攻撃を優先。新技は無敵なし・被弾中断あり・通常チェーンへの予約なし。
- 描画は `BeltArt.prepareDash()` / `dashFrame()` / `drawDash()`。`art/dash-<キャラ>.png` の6枚・144姿勢を built-in image_gen で制作。生成指示は `art/prompts-v2.8-dash.json`。0〜7走行、8〜11予備動作、12〜17攻撃、18〜23復帰。神楽/フレイヤのコマ13・14は斬撃先端の切り出し補正あり。
- `data/belt-dash.js`（約18.6MB）を追加し、既存10パックと音響/音声エンジンは SHA-256 一致。基準は `verification/v27-source-hashes.json`。既存の `dash` / `heavy1` ボイスと強攻撃SEを使用。
- `node tools/verify-dash.cjs` で実キー入力・全6人・ボス・停止/中断・パイプ・回復・描画純粋性を検査。`verification/dash-report.json` と `dash-six-heroes.png` / `dash-<キャラ>.png` を保存する。

## 編集とビルド

- `assets/belt/engine.js`: ステージ、敵、プレイヤー、物体、進行、描画、追加シーン。
- `assets/belt/art.js`: 街専用の背景・物体・ボス描画。`art/manifest.json` は画像一覧と縁石位置。
- `assets/sprites/renderer.js`: 共通432姿勢の描画。新モードだけ衣装用パレットを指定。
- `assets/sprites/throws.js`: 共通の投げの姿勢・位置補間 `ThrowMotion.sample(u)`。
- `ai_studio_code.html`: 既存ゲーム本体、入力のESC/Q分岐、共通ヘルプと音量UI。
- `tools/build-sprites.mjs`: 画像・音声を既存領域へ、新モードをBELT_ENGINE領域へ埋め込む。

`node tools/build-sprites.mjs`を実行して配布用HTMLを更新する。埋め込み領域を直接編集しない。
共通キャラ18枚・対戦背景4枚・v2.7のWAV126本に、街専用PNG15枚（背景5・ボス3・物体1・ダッシュ6）を使用。
配布はHTMLと`data/`の11パックをセットにする。今回の変更前は`ai_studio_code.v2.7.0.backup.html`、旧街コードは`engine.v2.7.js`、旧描画は`art.v2.7.js`。既存10パックは変更なし。

## 操作

| 操作 | 入力 |
|---|---|
| 左右・奥行き移動 | WASD / 矢印 |
| ダッシュ | 前方向を素早く2回（→→ / ←← / D D / A A）、2回目を保持。離すと停止 |
| ダッシュ攻撃 | ダッシュ中 J / Z。強打で確定ダウン。ボスのアーマーも貫通 |
| 連続攻撃（パンチ→ボディ→アッパー）、地面のアイテムを拾う | J / Z。前の一撃が当たった時だけ次段へ |
| チェーン投げ | ↓（S）を入れたまま3発目。吹き飛ばさず自動で投げる |
| ジャンプ、空中で攻撃 | K / X / Space、その後 J / Z |
| 掴む | 敵へ正面から歩いて接近 |
| 掴み追撃 | J、最大3回 |
| 投げる | 掴み中の方向＋J、または近距離I |
| 掴みを解く | 掴み中K |
| 緊急全周攻撃 | L / C、または攻撃＋ジャンプ |
| ポーズ、ゲーム選択へ | ESC、ポーズ中Q |
| 操作説明 | H（進行停止） |

ジャンプと奥行きを分け、攻撃判定は床面の奥行き差と高さを検査する。
緊急攻撃は敵への命中時だけ最大HPの7.5%を消費し、HP1は残す。被弾中の脱出にも使える。
掴み保持中は第三者の攻撃で解除される。投げ動作中は保護される。
投げられた敵は他の敵を巻き込める（チェーン投げも同じ）。ジャンプ攻撃とアッパーはダウンを奪う。

## ステージと難易度

ステージ1「BLACK VEIN」。幅6,200、床面y=440〜626、5区画、9ウェーブ。

1. NEON ROW / ネオン街（2ウェーブ、6体）
2. DEAD END ARCADE / 廃ゲームセンター前（2ウェーブ、7体）
3. UNDERPASS / 高架下（2ウェーブ、7体）
4. BLACK MARKET / 闇市倉庫（2ウェーブ、8体）
5. THE IRON GATE / 鉄門（ボス＋2体、ボス激昂時に2体追加）

通常進行は計33体。全滅でGO表示、右に進むと次の区画。カメラと戻れる左端は後戻りしない。
初期残機3、20,000点で一度だけ1UP。区画ごと150秒。死亡後は同じ戦闘へ復帰、最終残機でゲームオーバー。
ボスと残敵を倒すとステージ1クリア。クリア画面で Enter を押すとステージ2（INFERNAL WORKS、v3.6.0）へ進む。

- RAZOR: 素早く回り込む。HP122。
- SHIV: 間合いが長い。HP106。
- BRICK: 遅いが体力と攻撃力が高い。HP232。
- IRON VOSS: HP1500。赤い予告の後に突進／全周の叩きつけ。HP45%未満で加速し、増援は一度だけ。

敵は最大2体が同時攻撃を準備し、他は位置を変える。ボスの攻撃は予告後に方向・床の軸を固定。
上下の回避、ジャンプ、攻撃後の隙への反撃が有効。ボスの攻撃中は通常攻撃で怯まないがダメージは入る。
木箱と缶を壊すと食料（最大HP36%回復）／現金（1200点）／鉄パイプ（8命中分）が出現する。

## 共有と分離

StreetActorはFighterを継承し、CHARACTERS、Fighter.drawBody、FighterSpritesのアトラス、
ThrowMotion.sample、StageArtの電脳都市画像、SoundEngine、FighterVoiceBankを使う。
対戦用のFighter.updateは呼ばない。奥行き、複数の敵、残機、区画のルールはNeonUprisingに保持する。
`x`はワールド横位置、`y`は床の奥行き、`z`は床からの高さ。見かけの足元は`y-z`。
深度順で描画し、影は床へ残す。描画は戦闘を進めない。雨・煙はtickに基づき乱数を消費しない。
敵の衣装パレットは実行時キャッシュで作成し、元の画像や共通シートは変更しない。肌色と無彩色は保持する。

HUB / STREET_SELECT / STREETを追加。既存TITLE / SELECT / BATTLE / RESULTの処理へは旧関数で委譲する。
窓のフォーカスを失うと新モードを一時停止し、入力を解除。ポーズ、ヘルプ、メニューでボイスを停止する。

## 検証

NodeからPlaywrightとChromeを使う（このPCのNODE_PATHはC:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules）。

```powershell
node tools/verify-belt.cjs
node tools/verify-dash.cjs
node tools/verify-belt-art.cjs
node tools/verify-sprites.cjs
node tools/verify-throws.cjs
node tools/verify-voice-update.cjs
```

`verification/belt-report.json`は奥行き・ジャンプ・攻撃・投げ・物体・アイテム・ゲート・残機・ボス・メニューを検査し、
全6人がキーボード入力のみの自動プレイでクリアした結果を記録する。通しプレイではHPや敵を直接変更しない。
個別の仕様検査は条件を作って確認する。人間による難易度の実プレイ評価とは区別すること。
既存対戦の2,880F比較、72組の投げ、全画像・音声復号は従来のテストで確認する。
画面記録はverification/arcade-hub.png、street-select.png、street-stage1.png、street-boss.png、street-clear.png。

## v2.2.0 の変更

- `hurt()`: アーマー中のボスは向きを変えない（突進中に背後から叩かれても予告どおりの方向へ進む）。
- `updateActor()`: `a.vy = z > 0 ? -vz : 0` を写し、共通描画のジャンプ上昇／下降姿勢を街モードでも使う。
- STREET_SELECT / HUB の人数は `CHARACTERS.length` 基準。カード矩形は `Game.prototype.streetCard(i)`。
- blur ハンドラは対戦（BATTLE）もポーズする。
- `StreetPalettes` の着色 canvas は `willReadFrequently: true`。
- `CanvasRenderingContext2D.filter` に対応しない環境（古い Safari など）では色相回転が効かず、敵は元の衣装色で表示される。動作には影響しない。
- 書式は Prettier（printWidth 120 / singleQuote / trailingComma none / CRLF）。編集後も同じ設定で整形してから `node tools/build-sprites.mjs`。

## v2.3.0 の変更

- `attack()`: ファイナルファイト方式。段階は `chainHit`（直前の段が命中）かつ `comboTTL` 内でのみ進む。1 段目 ATK_L、2 段目 ATK_C_L（ボディブロー）、3 段目 ATK_H（アッパー、`upper: true`）。空振りはパンチに戻る。
- `swing()`: 敵・破壊物への命中で `a.chainHit = true`。アッパーは `hurt(..., 'upper')` で vz 11 / knockX 5 と高く短く飛ぶ。ボスのアーマーは 'upper' も打撃扱い。
- チェーン投げ: 3 段目に入る瞬間に S / ↓ が押されていて正面 `reach` 以内に `grabbable()` の敵がいれば `beginGrab()` → `throwHeld(facing)` を即実行。投げた敵の体が他の敵に当たる処理は既存の `throwFlight` と共通。鉄パイプ所持中は投げに変化しない。
- `STREET.version`（現在 '3.0.0'）を HUB / STREET_SELECT の右上と HUD 右下に表示。バージョンを上げるときはここと HTML ヘッダー・index.html・README.md を揃える。

## v2.3.1 の変更

- `playerInput()`: チェーンが生きている間（`chain > 0 && chainHit && comboTTL > 0`）は上下入力を移動に使わない。↓を押しっぱなしにしても敵のレーンから外れず、3 発目が確実に投げになる。
- `grabbable(range, depth = 22)`: 奥行き引数を追加。チェーン投げは `grabbable(reach, 29)`（打撃と同じ奥行き）で敵を探す。
- `tools/verify-chain.cjs` にキー入力だけの再現（S 押しっぱなし＋J を 9 / 20 / 30F 間隔）を追加。

## v2.4.0 の変更

- `STREET.version` を `'2.4.0'` に更新（BGM 全 8 曲・全効果音・全 6 キャラ 126 ボイスの全面刷新に伴うバージョン更新。詳細は `assets/audio/README.md`、`assets/voices/PERFORMANCE.md`、および `ai_studio_code.html` 冒頭コメントを参照）。ベルトスクロールの挙動・仕様変更はなし。

## v2.5.0 の変更（グラフィックのみ）

- `art/` の PNG 9 枚は built-in image_gen で制作。背景は 5 区画それぞれ専用、物体は 4×2 の 8 コマ、ボスは 6×4 の 3 シート・72 姿勢。制作指示は `prompts-v2.5.json` と `prompts-v2.5-extra.json`。
- `BeltArt.prepareBoard()` は manifest の horizon で縁石を床 y=440 に合わせる。1464px 幅の背景を区画左端−96 に置き、192px の重なりで次区画をフェード合成。雨・蒸気・反射は tick から描画し、乱数や更新処理は使わない。
- 箱・缶は HP 24 未満で損傷コマ。拾得品の浮遊とラベルは維持し、パイプ所持時にも専用画像を表示。破壊・回復・得点・耐久・当たり判定は変更なし。
- IRON VOSS は赤黒い装甲コートと油圧ガントレットの独自デザイン。`kind === 'boss'` の描画だけ差し替え。内部の Titan 参照は声と既存ゲーム仕様の維持に使用。HP・AI・攻撃範囲・増援・予告は旧版のまま。
- `BeltArt.bossFrame()` は共通姿勢番号を使い、待機時の歩きコマを除外し、床叩きの接地を既存の SLAM 20F（ダメージと音）へ同期。アトラスは共通の 160px キャッシュ・16px 余白・微小断片除去を再利用。倒れコマの左端だけ切り出し範囲を補正。
- `art.js` は描画素材を読めなければ旧背景・旧物体・旧ボスに戻す。HTML 埋込なので外部通信なし。
- `verify-belt-art.cjs` はユーザーの v2.4.0 バックアップと非描画メソッド・定数・対戦コード・共通画像/声・音響埋込の一致を確認。画面は `verification/art-v25-*`、レポートは `verification/belt-art-report.json`。

## v2.6.0 の変更（当たり判定・配布形態）

- 当たり判定の数値は `STREET.hit` に集約。調整はこの表だけを触る。方針は「プレイヤーの攻撃は当てやすく、敵の攻撃は見て避けられる」。
- プレイヤー打撃: 奥行き 38px、背面 30px、地上は 4 フレーム持続、ジャンプ攻撃は 12 フレーム持続（`atk.active`〜`atk.until`）。持続中でも同じ相手には 1 回（敵は `atk.hit`、破壊物は `atk.props`）。
- レーン補助: 怯んだ敵（HIT_STAND）をプレイヤーの奥行きへ `laneAssist`（0.5）だけ引き寄せ、チェーンの 2・3 発目が外れにくい。
- 敵パンチは 1 フレーム判定のまま奥行き 22px（AI の開始条件と同じ）。ボス突進 30px、床叩き 150×70px。
- 投げた体の巻き込み 74×42px、アイテム拾得 62×38px、I キー投げの奥行き 34px、↓＋3 発目の投げ 38px。
- 配布は `ai_studio_code.html`＋`data/*.js`（10 本）。`node tools/build-sprites.mjs` が両方を生成する。`BELT_ART_SOURCES` は `CB_ASSETS.beltArt` を指す。
- `tools/verify-hit.cjs` が判定 24 項目と分割配布の整合を検査。`verify-belt-art.cjs` の v2.4.0 比較からは、今回変更した 7 メソッドと `STREET.hit` を除外している。

## v2.7.0 の変更（キャラクター音声の棒読み解消・効果音刷新）

- `STREET.version` を `'2.7.0'` に更新。ゲームロジック・当たり判定・物理・AI・スプライト・背景・BGM 譜面は v2.6.0 から一切変更なし。
- キャラクター音声（全 6 人・126 クリップ）の棒読み解消（`assets/voices/voicevox-config.json`、`tools/generate-voicevox.py`、`data/voices.js`）：長母音・二重母音・撥音を統合した音節単位のアクセント制御、複合必殺技の後半クライマックスリフト、時変エルミート補間による音節内 F0 演技コンター（立ち上がりしゃくり・気合の語尾フォール・被弾トレモロ）、誤読（`はあっ！`→`ハアッ！` 等）と疑問文イントネーション誤適用の修正。
- 効果音（SE）の爽快感強化（`assets/audio/engine.js`）：`synthImpact`（`punch / heavy / slash / metal / wood`）、`synthWhoosh`、`synthCatch`、`synthLanding`、`synthEnergy`、`synthReverse` に高速 FM トランジェント・ヒットスパーク倍音・2 段ショックウェーブ・金属分散チャープを導入し、`playHit / playGrapple / playSuper / playBreak` のステレオ・レイヤリングを強化。

## v3.6.0 — INFERNAL WORKS

ステージ1クリア後Enterで廃工場のステージ2へ。5区画と専用巨大ボスFURNACE MAWを追加。残機・スコア・キャラを継承し体力を回復。敗北時は当該ステージを再挑戦。

設定: engine.jsのSTREET_STAGES / FACTORY_AREAS。画像: art/factory-v360 と art/actions-v360。ボス音声: VOICEVOX:麒ヶ島宗麟。再構築: `node tools/build-sprites.mjs`。詳細引継ぎはHTML冒頭コメント。
