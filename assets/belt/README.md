# NEON UPRISING — Stage 1 / v2.0.0

`ai_studio_code.html`の起動メニューから選ぶ、1人用ベルトスクロールアクション。
既存の対戦ゲームは「OVERDRIVE」として同じメニューから起動する。

## 編集とビルド

- `assets/belt/engine.js`: ステージ、敵、プレイヤー、物体、進行、描画、追加シーン。
- `assets/sprites/renderer.js`: 共通432姿勢の描画。新モードだけ衣装用パレットを指定。
- `assets/sprites/throws.js`: 共通の投げの姿勢・位置補間 `ThrowMotion.sample(u)`。
- `ai_studio_code.html`: 既存ゲーム本体、入力のESC/Q分岐、共通ヘルプと音量UI。
- `tools/build-sprites.mjs`: 画像・音声を既存領域へ、新モードをBELT_ENGINE領域へ埋め込む。

`node tools/build-sprites.mjs`を実行して配布用HTMLを更新する。埋め込み領域を直接編集しない。
画像18枚・背景4枚・WAV126本はv1.7と共通。新モード用の画像ダウンロードや音声生成は不要。
単一HTMLをそのまま開いて遊べる。バックアップは`ai_studio_code.v1.7.0.backup.html`。

## 操作

| 操作 | 入力 |
|---|---|
| 左右・奥行き移動 | WASD / 矢印 |
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
ボスと残敵を倒すとステージ1クリア。未実装のステージ2には遷移しない。

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
- `STREET.version`（'2.3.1'）を HUB / STREET_SELECT の右上と HUD 右下に表示。バージョンを上げるときはここと HTML ヘッダー・index.html・README.md を揃える。

## v2.3.1 の変更

- `playerInput()`: チェーンが生きている間（`chain > 0 && chainHit && comboTTL > 0`）は上下入力を移動に使わない。↓を押しっぱなしにしても敵のレーンから外れず、3 発目が確実に投げになる。
- `grabbable(range, depth = 22)`: 奥行き引数を追加。チェーン投げは `grabbable(reach, 29)`（打撃と同じ奥行き）で敵を探す。
- `tools/verify-chain.cjs` にキー入力だけの再現（S 押しっぱなし＋J を 9 / 20 / 30F 間隔）を追加。
