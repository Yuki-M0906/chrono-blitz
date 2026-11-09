# キャラクターボイス v1.7.0 (v2.4.0 Studio Mastered) — 実装・引き継ぎ

2026-11-09。**全6人・126音をローカルのVOICEVOXで再合成・スタジオマスタリングし、ゲーム本体へ適用済みです。** falは使用していません。完成HTMLはオフラインで音声を再生できます。
v2.4.0では全126クリップに対し、モーラ単位のプロソディ調整（短母音の無声化防止、気合・掛け声の単一呼気フレーズ化と語尾の言い切りピッチ制御、促音 `cl` の保持、必殺技の自然な日本語アクセント核の維持）と、スタジオ・ボーカル・マスタリング（ハイパスフィルタ、キャラクター性別・声質別の3バンド・パラメトリックEQ、ソフトニー・オプトコンプレッサー、倍音エキサイター、ピーク目標正規化）を適用しました。

## 声と演出

| 人物 | 音源 | 発声の使い分け |
|---|---|---|
| 神楽 | 玄野武宏 | 通常 (11) ／ ツンギレ (40) ／ 悲しみ (41) |
| ヴォルト | 白上虎太郎 | ふつう (12) ／ おこ (34) ／ びえーん (33) ／ わーい (32) |
| フレイヤ | 四国めたん | ノーマル (2) ／ ツンツン (6) |
| タイタン | 麒ヶ島宗麟 | ノーマル (58) を基に、技・被弾・勝利ごとの抑揚と発声速度・低域共鳴を調整 |
| 綾女 | 中国うさぎ | ノーマル (61) ／ おどろき (62) ／ へろへろ (64) |
| セリーヌ | 九州そら | ノーマル (16) ／ ツンツン (18) ／ あまあま (17) |

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

- v2.3.1（今回の改修直前）の完成品は `ai_studio_code.v2.3.1.backup.html`、旧126WAVとmanifest・レポートは `assets/voices/backup-v1.7/` に保存しています。
- v1.6.0のバックアップは `ai_studio_code.v1.6.0.backup.html` および `assets/voices/backup-v1.6/`、さらに以前のSAPI音声は `assets/voices/backup-v1.5/` に保持しています。
