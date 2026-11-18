> v3.20.1 追記: 音声合成の元は Microsoft Edge Neural から Kokoro-82M（ローカル生成）へ変わりました。下の表の声の名前は v3.8.0 当時のもので、現在の配役は CREDITS.md と english-config.json の `kokoroVoice` を見てください。演技の付け方（溜め・ピッチ演出・マスタリング）は同じです。

# キャラクター＆ボス音声 v3.8.0 (Theatrical English Voice Overhaul) — 実装・引き継ぎ

2026-11-15。**全10名（主人公6名×22＋IRON VOSS/FURNACE MAW 各2＋双子ルカ/ミーシャ 各3＝全142音）を、棒読み感のない「芝居がかった」英語キャラクター演技音声へ全面刷新し、`data/voices.js` へ適用済みです。**
完成 HTML＋`data/` パックは合成済み 24kHz WAV データを内包しており、オフライン環境で再生できます。

## 設計方針（v3.8.0）

1. **全面英語化＆芝居がかった演技台本（`assets/voices/english-config.json`）**:
   - 直訳ではなくアーケード格闘・アニメ吹替調の感情豊かな英語台詞へ全面刷新。
   - TTS がアルファベット綴り読みや不自然な音に化けやすい疑似オノマトペ（`Guh`, `Nngh`, `Grrroooaaagh`, `Kyaaaah`, `Nooo` 等）をすべて実発音検証済みの鋭い英語リアクション（`Hyah!`, `Hah!`, `Bam!`, `Ack!`, `Oof!`, `Gah!`, `Unhand me!`, `Burn to ashes!` 等）へ置換し、全クリップ聴取確認。
   - 格闘ゲーム6名＋ボス2体＋双子2体に、それぞれ異なる演技キャラクターを持つ Microsoft Edge Neural Voices を配役。
2. **イベント別スピード/ピッチ演出＆2段階溜め構成（`tools/generate-english-voices.py`）**:
   - 超必殺技 (`super`)、必殺3段目 (`sp3`)、ボス登場 (`intro`)、決め台詞 (`finish`)、敗北断末魔 (`defeat`) を「低めで緊迫した前置きセグメント ＋ 65ms 無音間合い ＋ 高揚・絶叫クライマックスセグメント」の2段構成で個別合成・連結。
   - 通常/強攻撃・被弾・投げは速度（`+10〜+18%`）・ピッチ（`+12〜+18Hz`）を引き上げ、KO/敗北は悲痛な減速・下降へ振る演劇的デリバリーを適用。
3. **フォルマント保存型 NCC-PSOLA (`ncc_psola`) & 巨漢/怪物レイヤー (`apply_theatrical_acting`)**:
   - 短尺気合（`<0.95s`）に踏込上昇と鋭い語尾落ちを付与し、被弾/投げ飛び・KO/敗北には衝撃跳ね上がり＋急降下＋15〜17.5Hz 声帯トレモロを適用。
   - `titan`（+20%）と `voss`（+26%）には -11.5 半音胸部サブレイヤーを重畳、`maw` には -7.2 半音（変調付き）＋ -12 半音の二重オクターブ溶鉱炉モンスター咆哮とホール残響を追加。
4. **24kHz 4バンド・スタジオボーカルマスタリング (`master_voice`)**:
   - 78Hz HPF → キャラ声域別チェスト補強（122 / 175 / 235Hz）→ 3.2kHz 英語子音プレゼンス強調（+3.4dB）→ 7.4kHz エア感 → `super`/`finish`/`defeat`/`boss`/`monster` へのコンパクトホール残響 → ソフト飽和コンプレッション・目標 RMS/ピーク正規化・クリックレスフェード。

## 配役一覧（全142音）

| 人物 | 識別名 (`voice`) | 使用ボイス / 処理 |
|---|---|---|
| 神楽 | `EdgeNeural:Andrew` | `en-US-AndrewMultilingualNeural`（熱血剣士・2段階溜め超必殺） |
| ヴォルト | `EdgeNeural:Guy` | `en-US-GuyNeural`（ハイテンション＆挑発的スピードスター） |
| フレイヤ | `EdgeNeural:Aria` | `en-US-AriaNeural`（凛然たる氷の戦乙女） |
| タイタン | `EdgeNeural:Christopher` | `en-US-ChristopherNeural`（-30Hz 低音＋胸部サブ倍音） |
| 綾女 | `EdgeNeural:Ana` | `en-US-AnaNeural`（笑い声混じりの妖艶なくノ一） |
| セリーヌ | `EdgeNeural:Vivienne` | `fr-FR-VivienneMultilingualNeural`（フランス語圏貴族剣士） |
| IRON VOSS | `EdgeNeural:Brian` | `en-US-BrianMultilingualNeural`（-36Hz＋胸部サブレイヤー＋ホール） |
| FURNACE MAW | `EdgeNeural:BrianMaw` | `en-US-BrianMultilingualNeural`（-42Hz＋二重オクターブ怪物咆哮＋溶鉱炉残響） |
| ルカ | `EdgeNeural:Ava` | `en-US-AvaNeural`（双子姉・攻撃的リード） |
| ミーシャ | `EdgeNeural:Sonia` | `en-GB-SoniaNeural`（双子妹・英国調シャープな追撃） |

## 編集元と再生成

```powershell
./tools/english-voice-runtime/Scripts/python.exe -X utf8 tools/generate-english-voices.py --install
node tools/build-sprites.mjs
```

- 再生成前に試聴したい場合は `--install` なしで実行すると `assets/voices/generated-en/`（`preview.wav` 含む）のみに出力されます。
- 旧日本語版の検証保護ファイル `assets/voices/voicevox-config.json`（`verify-anime.cjs` がハッシュ検査）および `assets/voices/engine.js` は変更していません。
- v3.7.2 以前の完成品バックアップは `ai_studio_code.v3.7.2.backup.html` に保存しています。
