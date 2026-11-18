# ステージ3 キャラクター

2026-11-15 時点の最新は **v3.12.0**。デザイン微調整のあと、表情・歩行・攻撃・被弾の追加24姿勢を足した。次回は HTML 冒頭の v3.12.0 と、このファイルを読む。

## v3.12.0 追加動作

各体 `*-life.png`（coral / azure / pearl / luka / misha）。6列×4行。

- 0–5 待機の表情。14F ごと
- 6–11 歩行・走行。WALK_F
- 12–13 攻撃予備。14–17 攻撃。WINDUP / ATK_H
- 18–23 被弾・よろめき・回転・ダウン
- 双子の連携攻撃は従来の `*-motion` のまま
- SUNSET / LAGOON / ORCHID は別画像を持たない。`beachPalette` が ID 先頭で衣装色だけ回す

戦闘の受付フレーム、威力、敵AIの待ち時間は変えていない。シートが読めないときは従来の24姿勢に戻る。

## 依頼

STAGE 3「AZURE MIRAGE」（双子ボス ルカとミーシャ）の**キャラクター画像だけ**を微調整して差し替える。戦闘、進行、背景、音声、プレイヤー6人、ステージ1と2には触らない。

## いまの状態

完了。キャラクターデザインを微調整してある。姿勢、顔、髪型、手袋、靴、武器、6列×4行のコマ位置は元の24姿勢を維持している。

| ゲーム上の名前 | 元画像 | 内容 |
|---|---|---|
| CORAL / SUNSET | `coral.png` | デザイン微調整。SUNSET は従来の色相回転（hue 45） |
| AZURE / LAGOON | `azure.png` | デザイン微調整。LAGOON は hue 110 |
| PEARL / ORCHID | `pearl-transparent.png` | デザイン微調整。ORCHID は hue 80 |
| ルカ | `luka.png` と `luka-motion-transparent.png` | デザイン微調整。トンファーと槍の24姿勢を含む |
| ミーシャ | `misha.png` と `misha-motion-transparent.png` | デザイン微調整。リングとパラソルの24姿勢を含む |

色替え3種（SUNSET / LAGOON / ORCHID）は別画像を持たない。`assets/belt/art.js` の `beachPalette` が衣装色の画素だけを回す。

## 変更したファイル

- `assets/belt/art/resort-v370/` の上表7枚
- `data/resort-actors.js`（`beach-*` だけ再埋込。SHA-256 先頭10桁 `9d28440ff1`、旧 `12ce477561`）
- `ai_studio_code.html` の1行だけ。`data/resort-actors.js?v=9d28440ff1`

`engine.js`、`art.js`、背景5枚、`decor.png`、音声、プレイヤー、ステージ1と2は未変更。未使用の `pearl.png` と、透過処理前の `luka-motion.png` / `misha-motion.png` もそのまま。

## 戻し方

`backups/v3.7.1-swim-src/` に差し替え前の7枚がある。同じファイル名で `assets/belt/art/resort-v370/` へ戻し、下の手順で `data/resort-actors.js` を作り直し、HTML のクエリを `?v=12ce477561` に戻す。

## 再開時に守る画像の契約

- 配布サイズは 1536×1024 の RGBA。6列×4行。公称セルは 256px。
- 読み込みは `prepareBeachAtlas`。左へ 96px はみ出した武器を隣セルから取る。セルを境界で切って貼ると槍やパラソルが欠ける。
- 色替えが肌まで及ばないよう、衣装の色を維持する。
  - CORAL: 赤が緑の 1.8 倍より強い画素だけ回転する
  - AZURE: 青が赤の 1.2 倍より強い画素
  - PEARL: 青が緑の 1.3 倍より強い画素
- マニフェストが実際に読むのは `pearl-transparent.png` と `*-motion-transparent.png`。
- 描画前の `cleanCell` は、いちばん大きい連結成分だけ残す。体から離れたリングは従来どおり消えることがある。

全件を `node tools/build-sprites.mjs` で埋込すると、HTML 内のエンジンソースまで書き戻す。機構を動かさない再開では、`beach-*` だけを `data/resort-actors.js` に再出力し、`?v=` をそのファイルの SHA-256 先頭10桁に合わせる。

## 確認済み

Chrome でステージ3を描画した。CORAL、SUNSET、AZURE、LAGOON、PEARL、ルカの待機と、ルカの槍、ミーシャのパラソルを確認。`BeltArt.errors` は空。色替えは衣装側だけ。神楽と背景は従来のまま。バージョン表示は v3.7.1。

一部のコマで、手袋の有無やハイライトが元絵と完全には一致しない。フレーム番号と当たり判定は変えていない。
