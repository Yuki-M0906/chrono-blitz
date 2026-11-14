# キャラクターボイス v1.7.0 (v3.2.0 Natural Acting Prosody, AquesTalk Accent Control & NCC-PSOLA) — 実装・引き継ぎ

2026-11-13。**全6人・126音をローカルのVOICEVOX Core 0.17.1で再設計・再生成し、v3.1.0で残っていた二重抑揚歪み・カタカナ促音分断・漢字誤読・長時間フレーズのリサンプリング位相シマーを解消してゲーム本体（`data/voices.js`）へ適用済みです。** falは使用していません。完成HTML＋dataパックはオフラインで音声を再生できます。
v3.2.0では、棒読み・ロボット感・発音破綻をさらに徹底改善するため以下を実施しました：
1. **全126音の AquesTalk かなアクセント精密指定 (`voicevox-config.json` `kana` マップ)**：OpenJTalkのカタカナ促音途中分断（`ソコデ/スッ`, `ラグナロッッ/クッ`）や漢字誤読（`瞬獄閃`→`マドカゴク`, `震脚`→`フルエアシ`, `紫月閃`→`シズキ`, `霞走り`→`カスミハシリ`, `紅蓮天翔斬`→`アマガケキ`）をAquesTalkかな記法とアクセント核指定で完全に根絶。
2. **無歪みプロソディ造形 (`intonation_scale=1.0`＋プラトー打破 `sculpt_query`)**：v3.1.0の `intonation_scale=1.68` × F0倍率の二重増幅を撤廃し、神経ボコーダの自然域内でフレーズ前昇・アクセント頂点強調・語尾下降カーブを造形して自然な演劇的イントネーションを実現。短気合いの無声化復元と頭子音バースト確保（`ヒエンノマイ` の「エ」保持等）も実施。
3. **短気合い・KO専用 フォルマント保存型 NCC-PSOLA (`ncc_psola`)**：4モーラ以上の台詞・必殺技名は純粋なニューラル HiFi-GAN 波形をそのまま使い（位相シマー皆無）、3モーラ以下の鋭い掛け声・被弾・KO語尾のみに自己相関同期 TD-PSOLA で滑らかな気合いフォール・顫えを付与。
4. **キャラクター別VOICEVOX演技スタイルの再最適化**：セリーヌの静かな台詞を「ノーマル (16)」＋掛け声を「ツンツン (18)」、フレイヤの勝利を「ノーマル (2)」、綾女を生き生きとした「おどろき (62)」／KO「こわがり (63)」、ヴォルトのKOを悲痛な「びえーん (35)」、タイタンを重心低め（`pitch=-0.045`, スタイル `53`）、神楽を導入/勝利「ノーマル (11)」・技「ツンギレ (40)」・KO「悲しみ (41)」へ最適化。
5. **24kHzスタジオ・ボーカル・マスタリング (`master_voice`)**：2.5msクリックレス・オンセット、キャラ声域別チェストEQ＋3.1kHzプレゼンス強調＋7.2kHzエア強調、高速コンプ＋ソフトサチュレーション。

## 声と演出

| 人物 | 音源 | 発声の使い分け |
|---|---|---|
| 神楽 | 玄野武宏 | ノーマル (11: 導入・勝利) ／ ツンギレ (40: 技・攻撃・被弾) ／ 悲しみ (41: KO) |
| ヴォルト | 白上虎太郎 | わーい (32: セレクト・勝利) ／ おこ (34: 技・攻撃・被弾・超必殺導入) ／ びえーん (35: KO) |
| フレイヤ | 四国めたん | ノーマル (2: セレクト・勝利・KO・導入) ／ ツンツン (6: 技・攻撃・被弾) |
| タイタン | 麒ヶ島宗麟 | ノーマル (53, pitch=-0.045) を基に全126音のアクセント核・モーラ長・低域共鳴を最適化 |
| 綾女 | 中国うさぎ | ノーマル (61: 超必殺導入) ／ おどろき (62: 通常・勝利・技) ／ こわがり (63: KO) |
| セリーヌ | 九州そら | ノーマル (16: セレクト・勝利・導入) ／ ツンツン (18: 技・攻撃・被弾・KO) |

通常技は鋭い掛け声、被弾は緊迫した反応、勝利は落ち着いた余韻のある調子です。超必殺技は導入と決め台詞を分けて生成し、75msの溜めを設けています。
ゲーム内「技表・操作一覧」の末尾と [CREDITS.md](CREDITS.md) に音源クレジット・規約リンクを記載しています。再配布時もクレジットと規約遵守を引き継いでください。

## 編集元と再生成

- `voicevox-config.json`: 配役、スタイルID、話者別の速度・ピッチ、イベント別速度補正 (`eventSpeeds`)、技名の読み (`pronunciations`)、超必殺の区切り (`superSegments`)。
- `throw-lines.json`: 6人の投げ5イベントの台詞。掴み声は約0.5秒の拘束に収まる短い言葉にする。
- `performance-plan.json`: 126イベントの台詞と演技の意図。
- `tools/generate-voicevox.py`: イベント別スタイル・速度・抑揚、`sculpt_query()` によるモーラ単位のピッチ・子音長・母音長調整、`master_voice()` による24kHzスタジオ・ボーカル・マスタリング処理。
- `generated-v1.7/queries.json`: 実際に合成へ渡した全区間のモーラ、アクセント、各パラメータ。

作業フォルダーをカレントにして順に実行します。

```powershell
node tools/prepare-voice-direction.mjs
./tools/voicevox-runtime/venv/Scripts/python.exe -X utf8 tools/generate-voicevox.py
./tools/voicevox-runtime/venv/Scripts/python.exe tools/install-voicevox.py
node tools/build-sprites.mjs
node tools/verify-voice-update.cjs
node tools/verify-audio.cjs
node tools/verify-sprites.cjs
node tools/verify-throws.cjs
node tools/verify-belt.cjs
node tools/verify-chain.cjs
```

生成環境は専用venv内のVOICEVOX Core 0.17.1、ONNX Runtime 1.17.3、VVM 0.17.1。必要なモデルは0,2,3,4,9,10,12.vvmです。ユーザーから6音源の利用規約への明示的同意を得て取得しました。生成スクリプトはダウンロードや規約への自動同意を行いません。

まず `generated-v1.7/` に全126音声を生成し、`tools/install-voicevox.py` で126キー・形式・非無音・長さ・SHA-256ハッシュを検査してから `assets/voices/` に適用します。各音の長さ・サイズ・ピーク・RMSは `audio-report.json` に記録しています。

## 検証

- `verification/voice-update.json`: 全126音の更新、現用WAVとHTML埋込Base64データの一致、6話者クレジットの存在を確認。
- `verification/audio/report.json`: BGM全8曲・SE・ボイスによるダッキング・音量分離・連打負荷を確認。
- `verification/report.json`: 126音の復号と非無音、6人の実出力信号、同時発話、優先度、クールダウン、VOICE音量0、全体消音、ポーズと技表の停止を確認。
- `verification/throws.json`: 72組の投げ処理と、全6人の掴み・被掴み・投げ・空中・着地の実再生を確認。

## 復元と過去のバックアップ

- v3.1.0（今回の改修直前）の完成品は `ai_studio_code.v3.1.0.backup.html`、旧126WAVとmanifest・レポートは `assets/voices/backup-v1.7/` に保持し、さらに過去の完成品として `ai_studio_code.v3.0.0.backup.html`、`ai_studio_code.v2.6.0.backup.html`、`ai_studio_code.v2.3.1.backup.html`、`assets/voices/backup-v1.6/`、`assets/voices/backup-v1.5/` を保存しています。


## v3.5.0 ボスと主人公の締め台詞

同意済みの6音源で8本を追加し、全134音へ拡張。VOSSの登場/絶叫は麒ヶ島宗麟、各主人公のfinishは従来と同じ音源。再生成は `tools/generate-boss-voices.py`（専用venv）。`cinematic-v350/report.json`に全文、配役、スタイルID、音声クエリ、秒数、ピーク、RMS、ハッシュを保存。元の126音は変更していません。
