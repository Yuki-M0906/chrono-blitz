// v3.7.1 [UI-148]: start-stage button on the game select screen (HUB), driven by the real mouse and keyboard.
// Added in v3.7.2 [TEST-151]. Button and option rectangles come from the game (streetStageButton / streetStageOption),
// and the number of stages from STREET_STAGES, so adding a stage does not need an edit here.
// Run: node tools/verify-stage-select-v371.cjs
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright'), { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'verification', 'stage-select-v371');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || 'C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe', args: ['--mute-audio'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }), errors = [], checks = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => window.requestAnimationFrame = () => 0);
    await page.goto(pathToFileURL(path.join(root, 'ai_studio_code.html')).href);
    await page.evaluate(async () => { await Promise.all([FighterSprites.ready, StageArt.ready, BeltArt.ready]); sound.playBGM = () => {}; });
    const box = await page.locator('#gameCanvas').boundingBox(), sx = box.width / 1280, sy = box.height / 720;
    const layout = await page.evaluate(() => ({ button: game.streetStageButton(), options: STREET_STAGES.map((_, i) => game.streetStageOption(i)), stages: STREET_STAGES.map(s => ({ title: s.title, music: s.music })) }));
    const mid = r => [r.x + r.w / 2, r.y + r.h / 2], count = layout.stages.length;
    const click = async ([x, y]) => { await page.mouse.click(box.x + x * sx, box.y + y * sy); await page.evaluate(() => { game.update(); game.draw(); }); };
    const key = async k => { await page.keyboard.press(k); await page.evaluate(() => { game.update(); game.draw(); }); };
    const state = () => page.evaluate(() => ({ scene: game.scene, gate: game.awaitStart, menu: !!game.streetStageMenu, cursor: game.streetStageCursor, start: game.streetStartStage || 0, hub: game.hubChoice || 0,
      stage: game.street?.stageIndex, lives: game.street?.lives, score: game.street?.score, kills: game.street?.kills, modal: game.modalOpen }));
    const check = (ok, name, detail) => { assert.ok(ok, name + (detail ? ' ' + JSON.stringify(detail) : '')); checks.push(name); };
    const button = mid(layout.button), last = count - 1;
    let s;
    assert.ok(count >= 2, 'stage select needs more than one stage');
    // The very first click is the start gesture [FIX-81], even on the button.
    await click(button); s = await state(); check(!s.gate && !s.menu && s.scene === 'HUB', 'first click on the button only passes the start gate', s);
    await click(button); s = await state(); check(s.menu && s.cursor === 0, 'button opens the menu on the current stage', s);
    await page.locator('#gameCanvas').screenshot({ path: path.join(out, 'open.png') });
    await click(mid(layout.options[last])); s = await state(); check(!s.menu && s.start === last && s.hub === 1 && s.scene === 'HUB', 'mouse picks the last stage and selects the belt card', s);
    await page.locator('#gameCanvas').screenshot({ path: path.join(out, 'closed.png') });
    // Option 0 overlaps the bottom edge of the belt card; neither it nor an outside click may fall through to the card.
    await click(button); await click(mid(layout.options[0])); s = await state(); check(!s.menu && s.start === 0 && s.scene === 'HUB', 'option over the card does not click through', s);
    await click(button); await click([800, 400]); s = await state(); check(!s.menu && s.scene === 'HUB' && s.start === 0, 'outside click closes without entering the card', s);
    // Keyboard inside the menu: up / down wrap, Enter chooses, Escape closes, left / right do not switch cards.
    await click(button); await key('ArrowUp'); s = await state(); check(s.menu && s.cursor === last, 'ArrowUp wraps to the last stage', s);
    await key('KeyS'); s = await state(); check(s.cursor === 0, 'S wraps to the first stage', s);
    await key('ArrowDown'); await key('KeyW'); await key('ArrowDown'); s = await state(); check(s.cursor === 1, 'ArrowDown / W move the cursor', s);
    await key('ArrowLeft'); s = await state(); check(s.menu && s.hub === 1, 'left / right are ignored while the menu is open', s);
    await key('Escape'); s = await state(); check(!s.menu && s.scene === 'HUB' && s.start === 0, 'Escape closes the menu and keeps the choice', s);
    await click(button); await key('ArrowDown'); await key('Enter'); s = await state(); check(!s.menu && s.start === 1 && s.scene === 'HUB', 'Enter chooses the highlighted stage', s);
    // The help modal can open over the menu and closes first.
    await click(button); await key('KeyH'); s = await state(); check(s.modal && s.menu, 'help opens over the menu', s);
    await key('Escape'); s = await state(); check(!s.modal && s.menu && s.scene === 'HUB', 'Escape closes the help first', s);
    await key('Escape');
    // Every stage: choose it, enter the belt card, choose a hero, get a fresh run on that stage, return to the HUB.
    for (let i = 0; i < count; i++) {
      await click(button); await click(mid(layout.options[i]));
      await key('Enter'); s = await state(); check(s.scene === 'STREET_SELECT', 'belt card opens hero select for stage ' + (i + 1), s);
      await key('ArrowRight'); await key('Enter'); s = await state();
      check(s.scene === 'STREET' && s.stage === i && s.lives === 3 && s.score === 0 && s.kills === 0, 'fresh run on stage ' + (i + 1) + ' ' + layout.stages[i].title, s);
      await key('Escape'); await key('KeyQ'); s = await state(); check(s.scene === 'HUB' && !s.menu && s.start === i, 'pause, Q returns to the HUB and keeps stage ' + (i + 1), s);
    }
    // A cleared run still advances in order and the last stage wraps to a fresh stage 1, whatever the start stage was.
    const flow = await page.evaluate(() => { game.startStreet(0, game.streetStartStage); const s = game.street; s.score = 1234; s.finish(true); const score = s.score; s.resultTick = 46; input.just = { Enter: true }; s.update(); input.just = {};
      const r = { stage: game.street.stageIndex, score: game.street.score, expected: score }; game.openHub(); return r; });
    check(flow.stage === 0 && flow.score === 0, 'clearing the last stage restarts at stage 1 with a fresh score', flow);
    // The classic game is unaffected, and drawing the HUB never changes state.
    const pure = await page.evaluate(() => { game.streetStageMenu = true; const snap = () => JSON.stringify([game.scene, game.stageTick, game.hubChoice, game.streetStageMenu, game.streetStageCursor, game.streetStartStage, sound.seed]); const a = snap(); for (let i = 0; i < 5; i++) game.draw(); const same = a === snap(); game.streetStageMenu = false; return same; });
    check(pure, 'drawing the menu changes no state');
    await key('ArrowLeft'); await key('Enter'); s = await state(); check(s.scene === 'TITLE', 'OVERDRIVE card still opens its title', s);
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ version: await page.evaluate(() => STREET.version), stages: layout.stages, checks }, null, 2));
    console.log({ checks: checks.length, errors });
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
