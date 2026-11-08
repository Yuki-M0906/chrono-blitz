// v1.7 throw choreography. Simulation owns timing; drawing never mutates these values.
const ThrowMotion = {
  locked(f) { return f && (f.state === 'GRABBED' || f.state === 'THROWING'); },
  begin(battle, attacker, victim, command = false) {
    const range = command ? 128 : 95;
    if (battle.grapple || !attacker.grounded || !victim.grounded || victim.invuln > 0 ||
        victim.hp <= 0 || ['KNOCKDOWN','WAKEUP','GRABBED','THROWING'].includes(victim.state) ||
        Math.abs(victim.x-attacker.x) >= range) return false;
    let dir = victim.x >= attacker.x ? 1 : -1;
    // Throw into the stage when backed against a wall, so both bodies remain readable.
    if (attacker.x > 1230) dir = -1;
    if (attacker.x < 370) dir = 1;
    // A victim grabbed out of hitstun continues the attacker's combo; the HUD counter is updated on release.
    const g = { attacker, victim, command, dir, t:0, duration:command?36:30, comboed:victim.hitstun>0||victim.state.startsWith('HIT'),
      originX:attacker.x, startX:victim.x, damage:command?Math.round(165*(attacker.tech?1.15:1)):115 };
    battle.grapple = g;
    attacker.vx=attacker.vy=0; victim.vx=victim.vy=0;
    attacker.facing=dir; victim.facing=-dir;
    victim.hitstun=victim.blockstun=0; victim.throwFlight=false; victim.throwLanding=false;
    attacker.setState('THROWING'); victim.setState('GRABBED');
    attacker.throwFrame=50; victim.throwFrame=60;
    this.position(g);
    fighterVoice.play(attacker.data.id,'throw',attacker.pIdx,76);
    fighterVoice.play(victim.data.id,'grabbed',victim.pIdx,77);
    sound.playGrapple('catch');
    return true;
  },
  sample(u) {
    // Foot/virtual-foot anchors; airborne art is centered inside its atlas cell.
    const keys=[[0,64,0],[.20,48,-4],[.40,28,-35],[.65,8,-103],[.86,23,-126],[1,64,-110]];
    let j=0;while(j<keys.length-2 && u>keys[j+1][0])j++;
    const left=keys[j],right=keys[j+1],q=Math.max(0,Math.min(1,(u-left[0])/(right[0]-left[0])));
    const smooth=q*q*(3-2*q),lerp=(v,w)=>v+(w-v)*smooth;
    return {dx:lerp(left[1],right[1]),dy:lerp(left[2],right[2]),
      attacker:48+(u<.15?2:u<.30?3:u<.43?4:u<.57?5:u<.76?6:7),
      victim:48+(u<.18?12:u<.38?13:u<.60?14:u<.82?15:16)};
  },
  position(g) {
    const a=g.attacker,b=g.victim,pose=this.sample(g.t/g.duration);
    a.x=g.originX;a.y=GROUND_Y;
    b.x=Math.max(90,Math.min(1510,a.x+g.dir*pose.dx));
    b.y=GROUND_Y+pose.dy;
    if(g.t<4)b.x=g.startX+(b.x-g.startX)*(g.t+1)/4;
    a.throwFrame=pose.attacker;
    b.throwFrame=pose.victim;
  },
  update(battle) {
    const g=battle.grapple;if(!g)return false;
    if(g.attacker.state!=='THROWING'||g.victim.state!=='GRABBED') {this.cancel(battle);return false;}
    g.t++;g.attacker.f++;g.victim.f++;g.attacker.animTick++;g.victim.animTick++;
    this.position(g);
    if(g.t>=g.duration)this.release(battle,g);
    return true;
  },
  release(battle,g) {
    const a=g.attacker,b=g.victim;
    battle.grapple=null;
    a.setState('THROW_RECOVER'); a.throwFrame=56;
    b.hp=Math.max(0,b.hp-g.damage);
    if(g.comboed)a.combo++;else{a.combo=1;a.comboDmg=0;}
    a.comboDmg+=g.damage;a.comboShow=70;
    b.throwFlight=true;b.throwLanding=false;b.facing=g.dir;
    b.vx=g.dir*(g.command?20:24);b.vy=g.command?-30:-22;
    b.hitstun=g.command?40:32;b.setState('HIT_AIR');
    a.meter=Math.min(100,a.meter+(g.command?18:12));
    a.hasHit=true;
    fighterVoice.play(a.data.id,'throw_release',a.pIdx,82);
    sound.playGrapple('release');
    battle.shake=Math.max(battle.shake,g.command?9:5);
    battle.addPopup(b.x,b.y-110,g.command?'GAIA BUSTER!!':'THROW!!',a.data.color);
  },
  land(f) {
    f.throwFlight=false;f.throwLanding=true;
    const b=f.battle;
    sound.playGrapple('impact');
    fighterVoice.play(f.data.id,'throw_impact',f.pIdx,86);
    if(b){b.shake=Math.max(b.shake,14);b.hitstop=Math.max(b.hitstop,6);
      b.spawnSparks(f.x,GROUND_Y-8,22,'#d6c7a4');}
  },
  cancel(battle) {
    const g=battle.grapple;battle.grapple=null;
    if(!g)return;
    for(const f of [g.attacker,g.victim]) {
      f.throwFrame=null;f.throwFlight=false;f.throwLanding=false;
      f.y=GROUND_Y;f.vx=f.vy=0;f.hitstun=f.blockstun=0;
      if(this.locked(f))f.setState('IDLE');
    }
  },
  sprite(f,state,frame) {
    if(state==='THROW')return frame<3?48:frame<9?49:frame<15?58:59;
    if(state==='THROWING'||state==='GRABBED')return f.throwFrame??50;
    if(state==='THROW_RECOVER')return frame<3?56:frame<6?57:frame<10?58:59;
    if(state==='HIT_AIR'&&f.throwFlight)return frame<5?64:frame<12?65:frame<19?66:67;
    if(f.throwLanding&&state==='KNOCKDOWN')return frame<5?68:69;
    if(f.throwLanding&&state==='WAKEUP')return frame<6?70:71;
    return null;
  }
};
