// Original nonverbal creature Foley. Run with Node to rebuild the six mono voice clips.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const rate=24000,tau=2*Math.PI;
// Duration, throat opening, pitch contour in Hz, and turbulent breath content.
const calls={
  intro:[1.45,.75,[47,91,56],.33], acid:[.66,.94,[73,102,65],.8],
  tail:[.56,.52,[65,91,43],.36], ram:[.87,.34,[54,76,38],.39],
  pain:[.41,.95,[86,142,67],.52], defeat:[2.35,.89,[62,122,29],.65]
};
for(const [index,[event,[length,jaw,pitches,air]]] of Object.entries(calls).entries()){
  const count=Math.ceil(length*rate),data=new Float32Array(count),body=new Float32Array(count);
  let seed=78133+index*371,phase=0,sub=0,slip=0,breath=0,last=0,peak=0;
  const modes=[95,148,220,328].map(width=>({r:Math.exp(-Math.PI*width/rate),a:0,y:0,z:0}));
  for(let i=0;i<count;i++){
    const t=i/rate,u=t/length;
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const noise=seed/2147483648-1;
    slip+=.0035*(noise-slip);breath+=.15*(noise-breath);
    const onset=Math.min(1,u/.19),release=Math.max(0,(u-.27)/.73);
    const pitch=(pitches[0]+(pitches[1]-pitches[0])*onset+(pitches[2]-pitches[1])*release)*
      (1+slip*.77+.025*Math.sin(tau*17*t));
    phase=(phase+pitch/rate)%1;sub=(sub+pitch*.481/rate)%1;
    const fold=p=>Math.exp(-10*p)-Math.exp(-38*p);
    const throat=(fold(phase)+.65*fold(sub))*(1+slip*2);
    const excitation=(throat-last)*6.4+(noise-breath)*(.11+air*.16)*(.25+throat);last=throat;
    const open=jaw*(.35+.65*Math.sin(Math.PI*Math.min(1,u/.9)));
    if(i%32===0){
      const formants=[224+310*open,625+390*open,1310+465*open,2430-330*open];
      modes.forEach((m,k)=>m.a=2*m.r*Math.cos(tau*formants[k]/rate));
    }
    let voice=0;
    modes.forEach((m,k)=>{
      const y=excitation*(1-m.r)+m.a*m.y-m.r*m.r*m.z;m.z=m.y;m.y=y;
      voice+=y*[2.4,2.1,1.35,.82][k];
    });
    const env=Math.min(1,t/.07)*Math.min(1,(length-t)/(.14+length*.13));
    const rasp=(throat-.26)*.48+breath*.14;
    body[i]=Math.tanh(3.1*(voice+rasp))*env;
    const echo=(i>2251?body[i-2251]*.16:0)+(i>3653?body[i-3653]*.09:0);
    data[i]=(body[i]+echo)*Math.min(1,(count-i)/800);peak=Math.max(peak,Math.abs(data[i]));
  }
  const wav=Buffer.alloc(44+count*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);
  wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(count*2,40);
  for(let i=0;i<count;i++)wav.writeInt16LE(Math.round(data[i]/peak*26700),44+2*i);
  fs.writeFileSync(fileURLToPath(new URL('../assets/voices/vesper-'+event+'.wav',import.meta.url)),wav);
}
