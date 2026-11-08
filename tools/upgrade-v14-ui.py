"""One-time, repeatable v1.4 UI migration; runtime remains inside the single HTML."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
file = root / 'ai_studio_code.html'
html = file.read_text(encoding='utf-8')
def replace_method(start, end, replacement):
    global html
    a = html.index(start)
    b = html.index(end, a)
    html = html[:a] + replacement.rstrip() + '\n\n' + html[b:]

replace_method('  updateSelect() {', '  getAIInput(', r'''
  updateSelect() {
    for (let i = 0; i < CHARACTERS.length; i++) this.getPreviewFighter(i).animTick++;
    const inside = r => input.mouseX >= r.x && input.mouseX <= r.x+r.w && input.mouseY >= r.y && input.mouseY <= r.y+r.h;
    if (input.clicked) {
      for (let i=0; i<STAGES.length; i++) if (inside(this.stageCard(i))) {
        this.stageIdx = i; sound.playUI('cursor'); return;
      }
    }
    const left = input.just.ArrowLeft || input.just.KeyA;
    const right = input.just.ArrowRight || input.just.KeyD;
    const up = input.just.ArrowUp || input.just.KeyW;
    const down = input.just.ArrowDown || input.just.KeyS;
    const confirm = input.just.Enter || input.just.Space || input.just.KeyJ || input.just.KeyZ;
    if (up || down) { this.stageIdx = (this.stageIdx + (up ? STAGES.length-1 : 1)) % STAGES.length; sound.playUI('cursor'); }
    const key = this.selectStep === 0 ? 'p1Char' : 'p2Char';
    if (left || right) { this[key] = (this[key] + (left ? CHARACTERS.length-1 : 1)) % CHARACTERS.length; sound.playUI('cursor'); }
    let picked = !!confirm;
    if (input.clicked) for (let i=0;i<CHARACTERS.length;i++) if (inside(this.characterCard(i))) { this[key]=i; picked=true; break; }
    if (picked) {
      sound.playUI('confirm');
      if (this.selectStep === 0 && this.mode !== 0) this.selectStep = 1;
      else {
        if (this.mode === 0) this.p2Char = (this.p1Char + 1) % CHARACTERS.length;
        this.startMatch();
      }
    }
  }

  characterCard(i) { return { x: 40+i*200, y: 80, w: 188, h: 240 }; }
  stageCard(i) { return { x: 40+i*304, y: 480, w: 288, h: 144 }; }
''')

replace_method('  drawSelect() {', '  drawBattle() {', r'''
  drawSelect() {
    this.drawStageBg(this.stageIdx, 0);
    ctx.fillStyle = 'rgba(5, 9, 22, 0.86)'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.textAlign='center'; ctx.fillStyle='#00edff'; ctx.font='italic 900 30px sans-serif';
    ctx.fillText(this.selectStep === 0 ? 'SELECT YOUR FIGHTER' : 'SELECT OPPONENT', W/2, 42);
    ctx.fillStyle='#b1bfd9'; ctx.font='13px sans-serif';
    ctx.fillText(this.selectStep === 0 ? '1P キャラクター選択' : (this.mode === 2 ? '2P キャラクター選択' : 'CPU キャラクター選択'),W/2,63);
    for (let i=0;i<CHARACTERS.length;i++) {
      const data=CHARACTERS[i],r=this.characterCard(i);
      const p1=this.p1Char===i, p2=this.p2Char===i && this.selectStep===1;
      const active=(this.selectStep===0?p1:p2);
      ctx.fillStyle=active?'rgba(41,59,90,0.9)':'rgba(10,18,37,0.94)';
      ctx.strokeStyle=active?data.color:(p1?'#00dbea':'#33415c');ctx.lineWidth=active?3:1.5;
      drawRoundRect(ctx,r.x,r.y,r.w,r.h,10);ctx.fill();ctx.stroke();
      ctx.save();ctx.translate(r.x+r.w/2,r.y+172);ctx.scale(0.90,0.90);
      this.getPreviewFighter(i).drawBody(ctx,0,0,1,'IDLE',0,false);ctx.restore();
      ctx.textAlign='center';ctx.fillStyle=data.color;ctx.font='italic 900 21px sans-serif';ctx.fillText(data.name,r.x+r.w/2,r.y+199);
      ctx.fillStyle='#f1f4ff';ctx.font='bold 13px sans-serif';ctx.fillText(data.jpName+(data.origin?' / '+data.origin:''),r.x+r.w/2,r.y+218,180);
      ctx.fillStyle='#9facbf';ctx.font='10px sans-serif';ctx.fillText(data.title,r.x+r.w/2,r.y+233,178);
      ctx.font='bold 13px sans-serif';
      if(p1){ctx.fillStyle='#00edff';ctx.fillText('1P',r.x+22,r.y+21);}
      if(p2){ctx.fillStyle='#ff728e';ctx.fillText(this.mode===2?'2P':'CPU',r.x+r.w-25,r.y+21);}
    }
    const data=CHARACTERS[this.selectStep===0?this.p1Char:this.p2Char];
    ctx.fillStyle='rgba(8,16,33,0.96)';ctx.strokeStyle=data.color;ctx.lineWidth=1.5;
    drawRoundRect(ctx,40,335,1200,100,10);ctx.fill();ctx.stroke();
    ctx.textAlign='left';ctx.fillStyle=data.color;ctx.font='italic 900 22px sans-serif';ctx.fillText(data.name+'  '+data.jpName,60,364);
    ctx.fillStyle='#b5c9e1';ctx.font='13px sans-serif';ctx.fillText(data.style+'   '+data.quote,410,362,800);
    ctx.fillStyle='#f3ddb1';ctx.font='bold 14px sans-serif';
    ctx.fillText('必殺技 [L / C]   N: '+data.spNames[0]+'   前: '+data.spNames[1]+'   後: '+data.spNames[2],60,391,1160);
    ctx.fillStyle='#99e7f1';ctx.fillText('超必殺 [U / V]   '+data.superName+'  /  '+data.superSub,60,419,1160);
    ctx.fillStyle='#f8d98e';ctx.font='bold 17px sans-serif';ctx.fillText('SELECT STAGE',40,464);
    ctx.fillStyle='#b5c9e1';ctx.font='13px sans-serif';ctx.fillText('クリック / W・S / ↑・↓ で選択',205,463);
    for(let i=0;i<STAGES.length;i++) {
      const r=this.stageCard(i),s=STAGES[i];
      ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,106);ctx.clip();ctx.translate(r.x,r.y);
      ctx.scale(r.w/1280,106/720);StageArt.draw(ctx,i,0,0,false);ctx.restore();
      ctx.fillStyle='#101a30';ctx.fillRect(r.x,r.y+106,r.w,38);
      ctx.strokeStyle=this.stageIdx===i?'#ffe29c':'#3a4960';ctx.lineWidth=this.stageIdx===i?3:1;ctx.strokeRect(r.x,r.y,r.w,r.h);
      ctx.textAlign='left';ctx.fillStyle=s.color;ctx.font='bold 14px sans-serif';ctx.fillText(s.short,r.x+10,r.y+122);
      ctx.fillStyle='#aabbd3';ctx.font='9px sans-serif';ctx.fillText(s.label,r.x+10,r.y+137);
      if(this.stageIdx===i){ctx.textAlign='right';ctx.fillStyle='#ffe29c';ctx.font='bold 12px sans-serif';ctx.fillText('SELECTED',r.x+r.w-10,r.y+129);}
    }
    ctx.textAlign='center';ctx.fillStyle='#c5d5eb';ctx.font='bold 14px sans-serif';
    ctx.fillText('キャラ: A・D / ←・→　　決定: Enter / J / Z またはカードをクリック',W/2,654);
    ctx.restore();
  }
''')

replace_method('  drawStageBg(idx, camX) {', '  drawSuperCutin(', r'''
  drawStageBg(idx, camX) {
    StageArt.draw(ctx, idx, camX, this.stageTick);
  }
''')

# Keep the original four manual cards; add the two newcomers to the in-game move list.
marker = '        <div class="card" data-v14="new-fighters">'
if marker not in html:
    pos = html.index('      </div>\n    </div>\n  </div>\n</div>\n\n<script>')
    cards = '''        <div class="card" data-v14="new-fighters">
          <h3>🌙 AYAME (綾女 / 日本) - 月影流双扇術</h3>
          <div class="row"><span>紫月扇 (紫の扇弾)</span><span>L / C または ↓↘→+攻</span></div>
          <div class="row"><span>飛燕の舞 (無敵対空)</span><span>前+必殺 または →↓↘+攻</span></div>
          <div class="row"><span>霞走り (高速突進)</span><span>後+必殺 または ↓↙←+攻</span></div>
          <div class="row"><span>秘奥義・百花繚乱</span><span>ゲージ100%時 U / V</span></div>
        </div>
        <div class="card">
          <h3>🌹 CELINE (セリーヌ / フランス) - 翠薔薇剣術</h3>
          <div class="row"><span>ローズエクレール (翠の剣気)</span><span>L / C または ↓↘→+攻</span></div>
          <div class="row"><span>フルールランジ (踏み込み突き)</span><span>前+必殺 または →↓↘+攻</span></div>
          <div class="row"><span>エメラルドリポスト (無敵斬り返し)</span><span>後+必殺 または ↓↙←+攻</span></div>
          <div class="row"><span>エトワール・デュ・ソワール</span><span>ゲージ100%時 U / V</span></div>
        </div>
'''
    html = html[:pos] + cards + html[pos:]
file.write_text(html, encoding='utf-8')
print('v1.4 selection, stage UI and move list updated')
