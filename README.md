# CHRONO BLITZ: ARCADE COLLECTION

**Play in your browser / ブラウザで遊ぶ:** https://yuki-m0906.github.io/chrono-blitz/

An arcade collection that runs in a desktop browser, with two games: the 1-on-1 2D fighter **OVERDRIVE** and the side-scrolling beat 'em up **NEON UPRISING**. Nothing to install. A keyboard is required.

パソコンのブラウザで遊べるアーケードコレクションです。2D 対戦格闘「OVERDRIVE」と、1 人用ベルトスクロールアクション「NEON UPRISING」の 2 本を収録しています。インストールは不要です。キーボードが必要です。

## Games / 収録ゲーム

| | OVERDRIVE | NEON UPRISING |
|---|---|---|
| Genre / ジャンル | 1-on-1 versus fighting / 対戦格闘 | Side-scrolling beat 'em up, 1 player / ベルトスクロールアクション（1 人用） |
| Content / 内容 | 6 fighters, 4 stages / 6 人、4 ステージ | 5 stages and a bonus round, each stage with a boss / 5 ステージとボーナス、各ステージにボス |
| Modes / モード | ARCADE, VS CPU, VS 2P, TRAINING | Start from any stage / 開始ステージを選べる |

## Controls / 操作

| | OVERDRIVE (1P) | NEON UPRISING |
|---|---|---|
| Move / 移動 | `W` `A` `S` `D` or arrow keys / または矢印キー | `W` `A` `S` `D` |
| Attack / 攻撃 | `J` light / 弱, `K` heavy / 強, `L` special / 必殺技, `U` super / 超必殺技 | `J` attack, press repeatedly for a combo / 攻撃（連打で連続技） |
| Other / その他 | `I` throw / 投げ, `O` burst / バースト | `K` jump / ジャンプ, `I` throw / 投げ, `L` emergency attack / 緊急技 |

- 2P (OVERDRIVE): arrow keys and `N` `M` `,` `.` `/` `;` / 矢印キーと `N` `M` `,` `.` `/` `;`
- `H`: command list / 技と操作の一覧　`ESC`: pause / ポーズ
- Gamepads and touch screens are not supported. / ゲームパッドとタッチ操作には対応していません。

The demo page lists the remaining moves. / そのほかの技は、デモのページに載せています。

## Tech / 技術

- HTML5 Canvas 2D, fixed 60 Hz simulation, 1280×720 logical resolution. / HTML5 Canvas 2D、固定 60Hz 更新、論理解像度 1280×720
- Music and sound effects are synthesized in the browser with the Web Audio API. / BGM と効果音は Web Audio API でブラウザ内で合成
- Plain HTML and JavaScript, with no framework and no server-side code. / フレームワークもサーバー側の処理も使わない、HTML と JavaScript だけの構成
- The game is `ai_studio_code.html` plus the asset packs in `data/` (about 300 MiB in total), so the first load takes a while. / ゲーム本体は `ai_studio_code.html` と `data/` フォルダのアセットパック（計約 300MiB）。初回の読み込みには時間がかかります

## Credits / クレジット

Character voices are English lines synthesized on the author's machine with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (model: Apache-2.0; runtime `kokoro-onnx`: MIT) and then processed for effect. The creature sounds of the last boss are original synthesis.

キャラクターボイスは、オープンソースの音声合成モデル Kokoro-82M（Apache-2.0）で作者の手元で生成し、演出用に加工した英語の台詞です。最終ボスの声は独自に合成しています。
