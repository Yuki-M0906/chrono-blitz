// v1.6: embedded VOICEVOX PCM clips. v1.5 mixing, priority, cooldown and stop behavior retained.
class FighterVoiceBank {
  constructor(sources, profiles) {
    this.sources=sources; this.profiles=profiles; this.buffers=new Map();
    this.channels=new Map(); this.pending=new Map(); this.cooldowns=new Map(); this.variants=new Map();
    this.volume=.85; this.sound=null; this.ready=null; this.errors=[]; this.history=[];
    this.debug=false; this.generation=0;
  }
  bind(sound) {
    if(this.sound || !sound.ctx) return;
    this.sound=sound;this.gain=sound.ctx.createGain();this.gain.connect(sound.comp);this.updateVolume();
    this.ready=Promise.all(Object.entries(this.sources).map(async([key,uri])=>{
      try {
        const raw=atob(uri.slice(uri.indexOf(',')+1)),bytes=new Uint8Array(raw.length);
        for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
        this.buffers.set(key,await sound.ctx.decodeAudioData(bytes.buffer));
      }catch(error){this.errors.push(key+': '+error.message);}
    }));
  }
  updateVolume() {
    if(this.gain) this.gain.gain.setTargetAtTime(this.sound.muted?0:this.volume*.95,this.sound.ctx.currentTime,.015);
    if(this.volume<=0 || this.sound?.muted) this.stopAll();
  }
  duck() {
    const s=this.sound;if(!s?.ctx)return;
    s.bgmGain.gain.setTargetAtTime(s.muted?0:s.bgmVol*.35*(this.channels.size ? .62 : 1),s.ctx.currentTime,.05);
  }
  stopChannel(channel) {
    const current=this.channels.get(channel);if(!current)return;
    this.channels.delete(channel);
    const now=this.sound.ctx.currentTime;
    current.gain.gain.cancelScheduledValues(now);current.gain.gain.setTargetAtTime(0,now,.008);
    try{current.source.stop(now+.035);}catch(error){}
    this.duck();
  }
  stopAll() {
    this.generation++;this.pending.clear();this.cooldowns.clear();
    for(const channel of [...this.channels.keys()])this.stopChannel(channel);
  }
  play(id,event,player=0,priority=30) {
    const s=this.sound;
    if(!s?.ctx || s.muted || this.volume<=0 || document.hidden || s.ctx.state!=='running')return false;
    const channel=player,now=performance.now(),group=event.replace(/[01]$/,'');
    const cooldown={light:240,heavy:330,jump:360,dash:500,hurt:360,sp1:200,sp2:200,sp3:200,super:500,throw:400,burst:500,select:250,win:800,ko:800}[group]||250;
    const stamp=channel+':'+group;
    if(now-(this.cooldowns.get(stamp)??-Infinity)<cooldown)return false;
    const active=this.channels.get(channel),pending=this.pending.get(channel);
    if(active && active.priority>priority)return false;
    if(pending && pending.priority>priority)return false;
    const key=id+'-'+event;
    if(!this.sources[key])return false;
    this.cooldowns.set(stamp,now);
    const request={key,channel,priority,generation:this.generation,deadline:now+(priority>=70?900:300)};
    this.pending.set(channel,request);
    const start=()=>{
      if(this.pending.get(channel)!==request || request.generation!==this.generation)return;
      this.pending.delete(channel);
      if(performance.now()>request.deadline || s.muted || this.volume<=0 || document.hidden || s.ctx.state!=='running')return;
      const buffer=this.buffers.get(key);if(!buffer)return;
      this.stopChannel(channel);
      const source=s.ctx.createBufferSource(),gain=s.ctx.createGain(),pan=s.ctx.createStereoPanner();
      source.buffer=buffer;pan.pan.value=player===1 ? .22 : -.22;
      source.connect(gain);gain.connect(pan);pan.connect(this.gain);
      gain.gain.setValueAtTime(0,s.ctx.currentTime);gain.gain.linearRampToValueAtTime(1,s.ctx.currentTime+.008);
      const entry={source,gain,pan,priority,key};this.channels.set(channel,entry);
      source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();if(this.channels.get(channel)===entry)this.channels.delete(channel);this.duck();};
      source.start();this.duck();
      if(this.debug){this.history.push({key,player,priority,time:s.ctx.currentTime});if(this.history.length>100)this.history.shift();}
    };
    if(this.buffers.has(key))start();else this.ready?.then(start);
    return true;
  }
  next(id,group,player) {
    const key=id+':'+player+':'+group,n=this.variants.get(key)||0;this.variants.set(key,n+1);return group+(n%2);
  }
  onState(fighter,state,previous) {
    if(!fighter.battle || fighter.battle.scene!=='BATTLE')return;
    const id=fighter.data.id,p=fighter.pIdx;
    if(state==='SUPER')return this.play(id,'super',p,100);
    if(/^SP_[123]$/.test(state))return this.play(id,state.toLowerCase().replace('_',''),p,75);
    if(state==='BURST')return this.play(id,'burst',p,90);
    if(state==='THROW')return this.play(id,'throw',p,50);
    if(['ATK_L','ATK_C_L','ATK_J_L'].includes(state))return this.play(id,this.next(id,'light',p),p,30);
    if(['ATK_H','ATK_F_H','ATK_C_H','ATK_J_H'].includes(state))return this.play(id,this.next(id,'heavy',p),p,40);
    if(state==='JUMP')return this.play(id,'jump',p,15);
    if(state==='DASH_F' || state==='DASH_B')return this.play(id,'dash',p,15);
    if((state==='HIT_STAND'||state==='HIT_AIR') && !previous.startsWith('HIT'))
      return this.play(id,fighter.hp<=0?'ko':this.next(id,'hurt',p),p,fighter.hp<=0?110:45);
  }
}
const fighterVoice=new FighterVoiceBank(VOICE_SOURCES,VOICE_PROFILES);
