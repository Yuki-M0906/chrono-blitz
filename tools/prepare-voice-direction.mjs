// Prepare a performance script only. Never overwrites the currently playable audio.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const voiceRoot=path.join(root,'assets/voices');
const manifest=JSON.parse(fs.readFileSync(path.join(voiceRoot,'manifest.json'),'utf8'));
const throwLines=JSON.parse(fs.readFileSync(path.join(voiceRoot,'throw-lines.json'),'utf8'));
const casting={
  kagura:{name:'神楽',voice:'成人男性。落ち着いた中低音、芯のある武人。短い言葉にも意志を込める。',performance:'通常は抑えた息と鋭い語頭。必殺では腹から声を放ち、決めの語尾を強く落とす。勝利は安堵と敬意。'},
  volt:{name:'ヴォルト',voice:'成人男性。明るい中音域、若々しく俊敏。自然な会話の軽さと自信。',performance:'笑みを感じる軽快な話し方。攻撃は前へ弾ける。必殺は加速する高揚、被弾は不意を突かれた息。'},
  freya:{name:'フレイヤ',voice:'成人女性。澄んだ中低音、凛とした騎士。穏やかさの奥に強さ。',performance:'短く明瞭な子音と落ち着いた母音。必殺だけ一段力強く解放する。被弾では気丈さが一瞬崩れ、勝利は静かな余韻。'},
  titan:{name:'タイタン',voice:'壮年男性。豊かで低い胸声、経験を感じる温かい響き。',performance:'重い呼気を一撃に乗せる。言葉の頭に重量感、語尾は太く短く。選択と勝利は豪快な余裕。低い声でも言葉を明瞭に。'},
  ayame:{name:'綾女',voice:'成人の日本人女性。軽やかで自然な中高音。いたずらっぽい余裕を持つ忍者。',performance:'近くの相手に話しかける親密な距離感。移動は微笑むように軽く、攻撃は鋭く切り替える。超必殺は優雅な導入から凛とした決めへ。'},
  celine:{name:'セリーヌ',voice:'成人のフランス人女性。艶やかな中音域、端正な発音。日本語は流暢で上品。',performance:'会話はしなやかな抑揚。攻撃ではフェンシングの踏み込みに合う鋭い呼気。必殺は気高く力強い。勝利は対戦相手への敬意を込める。'}
};
const cues={
  grabbed:{seconds:[.16,.5],energy:3,direction:'掴まれた瞬間の短い驚き。言葉を伸ばさず反射的に。'},
  throw_release:{seconds:[.2,.6],energy:5,direction:'持ち上げた相手を投げ放す瞬間の鋭い呼気。'},
  thrown:{seconds:[.2,.75],energy:4,direction:'空中に投げ飛ばされ、驚きと苦しさが混じる声。'},
  throw_impact:{seconds:[.15,.5],energy:4,direction:'地面へ落ち、息が一瞬押し出される短い反応。'},
  light0:{seconds:[.16,.42],energy:3,direction:'一撃の瞬間に短く息を吐く。母音を読み上げる感覚ではなく、身体から自然に漏れる鋭い掛け声。'},
  light1:{seconds:[.18,.48],energy:3,direction:'弱攻撃の別テイク。light0と声質を揃えつつ、語頭の勢いと息の抜け方を変える。'},
  heavy0:{seconds:[.3,.85],energy:4,direction:'踏み込みに合わせ、息を溜めてから腹で押す。語頭に力、終わりは短く切る。'},
  heavy1:{seconds:[.35,1],energy:4,direction:'狙いを定めた強打。相手へ言葉を投げる。heavy0と異なる自然なイントネーション。'},
  jump:{seconds:[.15,.4],energy:2,direction:'跳躍時の小さな呼気。身体を持ち上げる瞬間の短い声。'},
  dash:{seconds:[.3,.85],energy:2,direction:'移動しながら軽く言い放つ。相手との駆け引きを感じさせる、急ぎすぎない自然な会話。'},
  hurt0:{seconds:[.18,.48],energy:3,direction:'不意に一撃を受け、息が詰まる短い反応。痛みに一瞬だけ声が揺れる。'},
  hurt1:{seconds:[.25,.7],energy:4,direction:'強めの一撃で息が押し出される反応。hurt0より力が抜け、語尾が呼気へ消える。'},
  throw:{seconds:[.4,1.1],energy:3,direction:'相手を捉えた確信と踏ん張り。発声の中心に瞬間的な力を込める。'},
  burst:{seconds:[.4,1],energy:5,direction:'追い詰められた状態から一気に力を解放。鋭い語頭と強い決意、最後はすっと息を抜く。'},
  sp1:{seconds:[.55,1.5],energy:4,direction:'技名をひと息のまとまりで放つ。前半を自然に立ち上げ、最後のアクセントを攻撃の決めにする。'},
  sp2:{seconds:[.55,1.65],energy:4,direction:'踏み込みの勢いを声に乗せる。技名の中でも強弱をつけ、語末に芯を残す。'},
  sp3:{seconds:[.55,1.65],energy:4,direction:'狙い澄ました必殺。短い溜めから明瞭に放ち、締めを強く。技名全体を一続きに発声。'},
  super:{seconds:[1.25,2.7],energy:5,direction:'最初は低く決意を込め、意味の切れ目で約100msの間。そこから一気に高揚し、最後の技名を力強く解放する。'},
  select:{seconds:[1,2.5],energy:2,direction:'目の前の対戦相手への自然な呼びかけ。言葉の意味で抑揚を作り、キャラクターの性格を最も感じさせる。'},
  win:{seconds:[.7,2.1],energy:2,direction:'戦闘が終わった安堵をひと呼吸に込める。相手へ語りかける穏やかな余韻と、その人物らしい自信。'},
  ko:{seconds:[.5,1.6],energy:2,direction:'力を使い果たし、途切れがちな息の中からこぼれる言葉。敗北への感情を込め、語尾は自然に弱まる。'}
};
const lines={
  kagura:{light0:'はっ！',light1:'せいっ！',heavy0:'やあっ！',heavy1:'斬る！',jump:'ふっ！',dash:'行くぞ！',hurt0:'ぐっ……！',hurt1:'うっ……！',throw:'捉えた！',burst:'退けっ！',sp1:'えんげつ！',sp2:'ひえん！',sp3:'しゅんごくせん！',super:'奥義……ぐれんてんしょうざん！',select:'我が太刀、見切れるか？',win:'勝負あり。',ko:'……無念。'},
  volt:{light0:'はっ！',light1:'そらっ！',heavy0:'くらえっ！',heavy1:'決めるぜ！',jump:'よっと！',dash:'遅いぜ！',hurt0:'くっ！',hurt1:'ぐあっ！',throw:'捕まえた！',burst:'離れろっ！',sp1:'プラズマショット！',sp2:'ライトニングドライブ！',sp3:'サンダーサマー！',super:'オーバードライブ……ラグナロク！',select:'最高速で行こうぜ！',win:'俺の勝ちだ！',ko:'マジかよ……。'},
  freya:{light0:'はっ！',light1:'せいっ！',heavy0:'凍りなさい！',heavy1:'貫く！',jump:'ふっ！',dash:'参ります！',hurt0:'くっ……！',hurt1:'あっ！',throw:'逃がさない！',burst:'近寄らないで！',sp1:'グレイシャーピラー！',sp2:'ヴァルキリーランス！',sp3:'フロストノヴァ！',super:'アブソリュートゼロ……カリバー！',select:'静かな決着を。',win:'お眠りなさい。',ko:'そんな……。'},
  titan:{light0:'ふんっ！',light1:'どりゃっ！',heavy0:'うおおっ！',heavy1:'砕けろ！',jump:'ぬっ！',dash:'突き進む！',hurt0:'ぐぬっ……！',hurt1:'がはっ！',throw:'捕らえたぞ！',burst:'吹き飛べっ！',sp1:'しんきゃく……大地砕き！',sp2:'ギガントタックル！',sp3:'ガイアバスター！',super:'メテオ……カタストロフィ！',select:'さあ、かかって来い！',win:'まだまだじゃ。',ko:'……見事じゃ。'},
  ayame:{light0:'はっ！',light1:'えいっ！',heavy0:'そこね！',heavy1:'舞いなさい！',jump:'よっ！',dash:'こちらよ！',hurt0:'くっ……！',hurt1:'あっ！',throw:'つかまえた！',burst:'お下がりっ！',sp1:'しげつせん！',sp2:'ひえんのまい！',sp3:'かすみばしり！',super:'秘奥義……ひゃっかりょうらん！',select:'ついてこられるかしら？',win:'舞はここまで。',ko:'……不覚ね。'},
  celine:{light0:'はっ！',light1:'えいっ！',heavy0:'そこです！',heavy1:'貫きます！',jump:'ふっ！',dash:'失礼！',hurt0:'くっ……！',hurt1:'ああっ！',throw:'ごめんあそばせ！',burst:'お離れなさい！',sp1:'ローズエクレール！',sp2:'フルールランジ！',sp3:'エメラルドリポスト！',super:'エトワール……デュ・ソワール！',select:'美しい決闘を。',win:'見事な勝負でした。',ko:'……参りました。'}
};
const plan={
  schemaVersion:1, status:'direction_reference', sourceGameVersion:manifest.version, language:'ja-JP',
  note:'演技の設計台本。実際の音源と合成設定はvoicevox-config.json、適用状況はgeneration-status.json、合成したパラメータはgenerated-v1.7/queries.jsonを参照。',
  recording:'オリジナルの架空人物による日本語の格闘ゲーム音声。録音ブースでの乾いた近接マイク音。声だけ、BGM・効果音・残響・説明は含めない。各人物の声色とマイク距離を全テイクで統一する。演技指示は発声しない。',
  timing:'targetSecondsは収録目安。速さ優先で機械的にタイムストレッチせず、発声と演技を調整して再テイクする。息や語末を無音と誤認して切り捨てない。',
  review:'ファイル検査と実聴評価を区別して記録する。自然な日本語、技名の読み、キャラクターの一貫性、掛け声の勢いについて、実聴を行った場合のみ実聴評価として記録する。',
  profiles:casting,
  clips:[]
};
for(const [id,profile] of Object.entries(manifest.profiles)){
  if(!casting[id])throw new Error('Missing casting: '+id);
  for(const [event,originalText] of Object.entries({...profile.lines,...throwLines[id]})){
    const cue=cues[event],text=throwLines[id]?.[event]??lines[id]?.[event];
    if(!cue || !text)throw new Error('Missing direction: '+id+'-'+event);
    plan.clips.push({id:id+'-'+event,character:id,event,file:id+'-'+event+'.wav',originalText,text,targetSeconds:cue.seconds,energy:cue.energy,direction:cue.direction});
  }
}
if(plan.clips.length!==126 || new Set(plan.clips.map(c=>c.id)).size!==126)throw new Error('Expected 126 unique voice cues');
fs.writeFileSync(path.join(voiceRoot,'performance-plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log('Prepared 6 character directions / 126 performance cues. Existing audio unchanged.');
