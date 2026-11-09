// v1.7: embedded VOICEVOX clips, with capture/release/flight/impact voice milestones.
class FighterVoiceBank {
  constructor(sources, profiles) {
    this.sources=sources; this.profiles=profiles; this.buffers=new Map();
    this.channels=new Map(); this.pending=new Map(); this.cooldowns=new Map(); this.variants=new Map();
    this.volume=.85; this.sound=null; this.ready=null; this.errors=[]; this.history=[];
    this.debug=false; this.generation=0; this.inflight=new Set(); this.owners=new Map();
  }
  bind(sound) {
    if(this.sound || !sound.ctx) return;
    this.sound=sound;this.gain=sound.ctx.createGain();this.gain.connect(sound.comp);this.updateVolume();
    // Clips already decoded by preload() are kept; only the remainder is decoded on the live context.
    this.ready=this.decodeAll(sound.ctx).then(()=>{ for(const key of this.buffers.keys()) this.adopt(key); });
  }
  // A buffer decoded on the preload (offline) context plays silently on the live context in Chrome; copy it once.
  adopt(key) {
    const buffer=this.buffers.get(key),ctx=this.sound?.ctx;
    if(!buffer||!ctx||this.owners.get(key)===ctx)return buffer;
    const copy=ctx.createBuffer(buffer.numberOfChannels,buffer.length,buffer.sampleRate);
    for(let ch=0;ch<buffer.numberOfChannels;ch++)copy.copyToChannel(buffer.getChannelData(ch),ch);
    this.buffers.set(key,copy);this.owners.set(key,ctx);return copy;
  }
  // v2.2: decode ahead of the first gesture on any context (an OfflineAudioContext works) so init() no longer stalls.
  preload(context) {
    if(!this.ready) this.ready=this.decodeAll(context);
    return this.ready;
  }
  decodeAll(context) {
    const previous=this.ready;
    const batch=Promise.all(Object.entries(this.sources).filter(([key])=>!this.buffers.has(key)&&!this.inflight.has(key)).map(async([key,uri])=>{
      this.inflight.add(key);
      try { this.buffers.set(key,await context.decodeAudioData(await this.bytes(uri))); this.owners.set(key,context); }
      catch(error){this.errors.push(key+': '+error.message);}
      finally { this.inflight.delete(key); }
    }));
    return previous ? Promise.all([previous,batch]).then(()=>{}) : batch;
  }
  // fetch() turns the data URI into bytes off the main thread; the synchronous atob loop is only a fallback.
  async bytes(uri) {
    try { return await (await fetch(uri)).arrayBuffer(); }
    catch(error) {
      const raw=atob(uri.slice(uri.indexOf(',')+1)),out=new Uint8Array(raw.length);
      for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
      return out.buffer;
    }
  }
  updateVolume() {
    if(this.gain) this.gain.gain.setTargetAtTime(this.sound.muted?0:this.volume*.95,this.sound.ctx.currentTime,.015);
    if(this.volume<=0 || this.sound?.muted) this.stopAll();
  }
  duck() {
    const s=this.sound;if(!s?.ctx)return;
    if(s.duckMusic){s.duckMusic(this.channels.size>0);return;}
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
    const cooldown={light:240,heavy:330,jump:360,dash:500,hurt:360,sp1:200,sp2:200,sp3:200,super:500,throw:400,grabbed:400,throw_release:400,thrown:400,throw_impact:400,burst:500,select:250,win:800,ko:800}[group]||250;
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
      const buffer=this.adopt(key);if(!buffer)return;
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
    // Capture/release calls originate at the actual throw milestones, never on a whiff.
    if(state==='HIT_AIR'&&fighter.throwFlight)return this.play(id,'thrown',p,84);
    if(['ATK_L','ATK_C_L','ATK_J_L'].includes(state))return this.play(id,this.next(id,'light',p),p,30);
    if(['ATK_H','ATK_F_H','ATK_C_H','ATK_J_H'].includes(state))return this.play(id,this.next(id,'heavy',p),p,40);
    if(state==='JUMP')return this.play(id,'jump',p,15);
    if(state==='DASH_F' || state==='DASH_B')return this.play(id,'dash',p,15);
    if((state==='HIT_STAND'||state==='HIT_AIR') && !previous.startsWith('HIT'))
      return this.play(id,fighter.hp<=0?'ko':this.next(id,'hurt',p),p,fighter.hp<=0?110:45);
  }
}
const fighterVoice=new FighterVoiceBank(VOICE_SOURCES,VOICE_PROFILES);
