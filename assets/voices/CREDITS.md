# 音声クレジットと生成環境 / v3.20.1

v3.20.1 で、英語のキャラクター音声 142 本を Kokoro-82M（Apache-2.0 のオープンソース音声合成モデル。実行ライブラリ kokoro-onnx は MIT）によるローカル生成へ差し替えました。台本・溜めの分割・ピッチ演出・マスタリングは v3.8.0 と同じです。VESPER MATRIARCH の 6 本は独自合成です。

| ゲームの人物 | 音声クレジット (`manifest.json` `credit`) |
|---|---|
| 神楽 (KAGURA) | Kokoro-82M (am_fenrir) |
| ヴォルト (VOLT) | Kokoro-82M (am_puck) |
| フレイヤ (FREYA) | Kokoro-82M (af_bella) |
| タイタン (TITAN) | Kokoro-82M (bm_george) |
| 綾女 (AYAME) | Kokoro-82M (af_heart) |
| セリーヌ (CELINE) | Kokoro-82M (bf_emma) |
| IRON VOSS | Kokoro-82M (am_michael) |
| FURNACE MAW | Kokoro-82M (am_michael) |
| ルカ (LUKA) | Kokoro-82M (af_sarah) |
| ミーシャ (MISHA) | Kokoro-82M (bf_isabella) |
| VESPER MATRIARCH | Original synthesized creature vocals |

- 再生成: `tools/generate-english-voices.py --install`（既定エンジン kokoro。手順はスクリプト冒頭と HTML 冒頭の [VOICE-214]）
- 台本と配役: `assets/voices/english-config.json`（声は各配役の `kokoroVoice`）
- ライセンスの確認内容と、明文の無い点（声ごとのデータ、生成音声の再配布）は HTML 冒頭の [VOICE-214] に記録。
- 配布元: https://huggingface.co/hexgrad/Kokoro-82M

---

以下は v3.8.0〜v3.20.0 当時の記録です（Microsoft Edge のニューラル音声を edge-tts で生成。再配布条件を確認できなかったため差し替え済み）。

# 音声クレジットと生成環境 / v3.8.0

CHRONO BLITZ: ARCADE COLLECTION v3.8.0 のキャラクター音声は、棒読みを根絶し演劇的表現を前面に押し出すため、全面的に英語演技音声（全142クリップ）へ作り直しました。Microsoft Edge Neural Voices をベースに、2段階ドラマティック構成・NCC-PSOLA ピッチ造形・胸部サブ倍音・モンスター多重咆哮・24kHz 4バンドスタジオマスタリングを施しています。完成後の配布 HTML＋`data/` パックは WAV データを内包しており、完全オフラインで再生できます。

| ゲームの人物 | 音声クレジット (`manifest.json` `credit`) | 役柄・演出方針 |
|---|---|---|
| 神楽 (KAGURA) | Microsoft Edge Neural (en-US-AndrewMultilingualNeural) | 熱血剣士・2段階溜め超必殺 |
| ヴォルト (VOLT) | Microsoft Edge Neural (en-US-GuyNeural) | 挑発的スピードスター・ハイテンション |
| フレイヤ (FREYA) | Microsoft Edge Neural (en-US-AriaNeural) | 高潔な氷の戦乙女・凛とした威厳 |
| タイタン (TITAN) | Microsoft Edge Neural (en-US-ChristopherNeural) | 重厚巨漢戦士・低域+胸腔サブ倍音 |
| 綾女 (AYAME) | Microsoft Edge Neural (en-US-AnaNeural) | 妖艶かつ敏捷なくノ一・笑い声混じりの挑発 |
| セリーヌ (CELINE) | Microsoft Edge Neural (fr-FR-VivienneMultilingualNeural) | 誇り高いフランス語圏貴族剣士 |
| IRON VOSS | Microsoft Edge Neural (en-US-BrianMultilingualNeural) | 犯罪都市の支配者・低音+重厚サブレイヤー |
| FURNACE MAW | Microsoft Edge Neural (en-US-BrianMultilingualNeural + Furnace Monster FX) | 溶鉱炉の怪物・二重オクターブ低域咆哮+反響 |
| ルカ (LUKA) | Microsoft Edge Neural (en-US-AvaNeural) | リゾートの双子姉・攻撃的リード |
| ミーシャ (MISHA) | Microsoft Edge Neural (en-GB-SoniaNeural) | リゾートの双子妹・英国調シャープな追撃 |

- 再生成スクリプト: `tools/generate-english-voices.py`
- 台本・配役・溜めセグメント設定: `assets/voices/english-config.json`
- 旧日本語版設定 `assets/voices/voicevox-config.json` は `verify-anime.cjs` の整合チェック保護のため保持しています。
