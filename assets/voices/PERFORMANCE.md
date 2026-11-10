# キャラクターボイス v1.7.0 (v2.7.0 Expressive Acting & Mora Prosody) — 実装・引き継ぎ

2026-11-10。**全6人・126音をローカルのVOICEVOXで再合成・演技抑揚刷新・スタジオマスタリングし、ゲーム本体（`data/voices.js`）へ適用済みです。** falは使用していません。完成HTML＋dataパックはオフラインで音声を再生できます。
v2.7.0では、v2.4.0で残っていた「TTS特有の棒読み感・平板な読み上げ感」を根本から解消するため、以下を実施しました：
1. **平板化バグの除去と音節（シラブル）単位のプロソディ構築 (`group_syllables` / `set_syllable_pitch`)**：旧 `sculpt_query()` にあった定数ピッチ上書き（`max(m.pitch, max_pitch) + 0.14`）およびピッチ下限クランプ（`max_pitch - 0.32`）を廃止。長母音（`ー`／同母音連続）・二重母音（`ei`/`ou`）・撥音（`N`）を単一音節として結合し、音節途中でピッチが階段状に割れる現象を解消。
2. **複合必殺技のクライマックス・リフトとアクセント核明示 (`accentOverrides` + `replace_mora_pitch`)**：OpenJTalk の文末下降（ダウンステップ）により技名の後半が弱まる現象を逆転させ、後半の決め語（`天翔斬`、`バスター`、`ピラー`、`繚乱`、`ラグナロク`、`カタストロフィ`、`カリバー`、`ソワール` 等）へエネルギーとピッチ頂点が向かうよう設計。
3. **時変3次エルミート補間による音節内F0演技コンター (`expressive_warp`)**：モーラ内が1つの定数ピッチになるTTSの限界を突破するため、24kHz波形に対して連続位相保持リサンプリングを適用し、人間の声優の発声にある「語頭のしゃくり（Glottal Scoop）」「クライマックスの張り・微細ビブラート」「気合の語尾フォール（Kiai Release Kick）」「被弾・KO時の声帯トレモロ（14〜19.5Hz）」を付与。
4. **誤読・スタイル配役・疑問文イントネーションの修正**：`はあっ！` が助詞 `わ` と誤読されていた問題（フレイヤ・セリーヌの `throw_release`）を `ハアッ！` に修正。`select` で疑問符 `？` のない平叙文まで語尾上がりになっていた問題を修正し、綾女の攻撃・必殺ボイスにおどろき (62)、ヴォルトの選択・跳躍にわーい (32)、神楽の選択に喜び (39) など感情豊かなスタイルを最適配分。

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
