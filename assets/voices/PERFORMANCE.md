# キャラクターボイス v1.7.0 — 実装・引き継ぎ

2026-11-08。**全6人・126音をローカルのVOICEVOXで生成し、ゲーム本体へ適用済みです。** falは使用していません。完成HTMLはオフラインで音声を再生できます。v1.7では投げの掴み声6音を差し替え、掴まれる・投げる・空中・着地の24音を追加。その他96音はv1.6と同一です。

## 声と演出

| 人物 | 音源 | 発声の使い分け |
|---|---|---|
| 神楽 | 玄野武宏 | 通常／ツンギレ／悲しみ／喜び |
| ヴォルト | 白上虎太郎 | ふつう／おこ／びくびく／わーい／びえーん |
| フレイヤ | 四国めたん | ノーマル／ツンツン／あまあま |
| タイタン | 麒ヶ島宗麟 | ノーマルを基に、技・被弾・勝利ごとの抑揚と発声速度を調整 |
| 綾女 | 中国うさぎ | ノーマル／おどろき／へろへろ |
| セリーヌ | 九州そら | ノーマル／ツンツン／あまあま |

通常技は短い掛け声、被弾は短い反応、勝利は落ち着いた調子です。超必殺技は導入と決め台詞を分けて生成し、間を設けています。再生時の音程変更や時間伸縮は使用しません。実在するスタイルと合成時の設定を使用しています。

ゲーム内「技表・操作一覧」の末尾と [CREDITS.md](CREDITS.md) に音源クレジット・規約リンクを記載しています。再配布時もクレジットと規約遵守を引き継いでください。

## 編集元と再生成

- voicevox-config.json: 配役、スタイルID、話者別の速度・ピッチ、技名の読み、超必殺の区切り。
- throw-lines.json: 6人の投げ5イベントの台詞。掴み声は約0.5秒の拘束に収まる短い言葉にする。
- performance-plan.json: 126イベントの台詞と演技の意図。自由文の指示をVOICEVOXへ直接渡しているわけではありません。
- tools/generate-voicevox.py: イベント別スタイル・速度・抑揚、フレーズ接続、クリップ単位の声量調整。
- generated-v1.7/queries.json: 実際に合成へ渡した全区間のモーラ、アクセント、各パラメータ。

作業フォルダーをカレントにして順に実行します。

```powershell
node tools/prepare-voice-direction.mjs
./tools/voicevox-runtime/venv/Scripts/python.exe tools/generate-voicevox.py
python tools/install-voicevox.py
node tools/build-sprites.mjs
node tools/verify-voice-update.cjs
node tools/verify-sprites.cjs
node tools/verify-throws.cjs
```

生成環境は専用venv内のVOICEVOX Core 0.17.1、ONNX Runtime 1.17.3、VVM 0.17.1。必要なモデルは0,2,3,4,9,10,12.vvmです。ユーザーから6音源の利用規約への明示的同意を得て取得しました。生成スクリプトはダウンロードや規約への自動同意を行いません。

まずgenerated-v1.7/に全音声を生成し、installerで126キー・形式・非無音・長さ・ハッシュを検査してから適用します。声の弱い部分を無音として削除する処理は使っていません。ピーク上限は29200、増幅上限は1.35倍、両端は4msフェードです。各音の長さ・サイズはaudio-report.jsonに記録しています。

Playwright検証はNodeからplaywrightを読み込める環境とChromeが必要です。NODE_PATHとCHROME_BINで場所を指定できます。このPCのPlaywrightは C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules にあります。

## 検証と限界

verification/report.json: 126音の復号と非無音、6人の実出力信号、同時発話、優先度、クールダウン、VOICE音量0、全体消音、ポーズと技表の停止を確認。4背景と18アトラスも読み込み成功。投げを除く2,880フレームの戦闘結果がv1.6と一致し、ブラウザ例外は0です。

verification/voice-update.json: 新24音・差し替え6音・維持96音、現用WAVと埋込データの一致を確認。

verification/throws.json: 72組の投げ処理と、全6人の掴み・被掴み・投げ・空中・着地の実再生を確認。音声の呼び出し元はassets/sprites/throws.jsとassets/voices/engine.js。投げの空振りでは成立声を再生しません。

音声の実出力・波形・制御の自動検証と、人間による演技品質の実聴評価は別です。全126音を人間が実聴したという記録はありません。generated-v1.7/preview.wavは6人の必殺・超必殺・選択台詞を聴くための連続音声です。音源ごとに使える感情スタイルが異なります。

## 復元と過去の試作

今回の変更前の完成品はai_studio_code.v1.6.0.backup.html。旧102WAVとmanifest・レポートはassets/voices/backup-v1.6/。さらに以前のSAPI音声はbackup-v1.5/に保持しています。旧SAPI用のgenerate-voices.ps1とprepare-voices.pyは、新しいmanifestに対する実行を拒否し、誤上書きを防ぎます。

audition-local/は初回フレイヤ4音の試作記録です。比較用SAPI音声はバックアップを参照します。現在のゲーム音声の確認にはゲーム本体またはgenerated-v1.7/を使ってください。過去のfal試行はHTML冒頭の履歴とbackup-v1.5/generation-history.jsonに保存しています。falの残高追加は不要です。
