import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScenario, chromeAvailable } from './browser.mjs';

test('2-player cube smoke test', { skip: !chromeAvailable() && 'Chrome not found' }, async () => {
  const out = await runScenario(`
    const t = window.qubicTest, tap = p => t.tapAt(p.X, p.Y);
    tap(t.screenOf(0)); out.pendingAfterFirst = t.state.pending;
    tap(t.screenOf(0)); out.cell0 = t.state.board[0];
    tap(t.badgeOf(1)); out.layer = t.state.activeLayer;
    out.status = document.getElementById('status').textContent;
    out.title = document.querySelector('h1').textContent;
    tap(t.screenOf(16));
    window.dispatchEvent(new Event('resize'));
    await new Promise(r => setTimeout(r, 200));
    out.afterResize = { pending: t.state.pending, layer: t.state.activeLayer, cell0: t.state.board[0] };
    out.canvasWidth = document.getElementById('cube').width;
  `);
  assert.deepEqual(out.errors, []);
  assert.equal(out.title, 'Tic Tac Toe 4×4×4');
  assert.equal(out.pendingAfterFirst, 0);
  assert.equal(out.cell0, 'X');
  assert.equal(out.layer, 1);
  assert.equal(out.status, "O's turn · layer 2");
  assert.deepEqual(out.afterResize, { pending: 16, layer: 1, cell0: 'X' });
  assert.ok(out.canvasWidth > 0);
});

test('pointer events: jittery taps place, drags only rotate', { skip: !chromeAvailable() && 'Chrome not found' }, async () => {
  const out = await runScenario(`
    const t = window.qubicTest, cv = document.getElementById('cube');
    const fire = (type, x, y) => { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent(type, { pointerId: 1, bubbles: true, clientX: r.left + x, clientY: r.top + y })); };
    const jitterTap = p => {
      fire('pointerdown', p.X, p.Y);
      fire('pointermove', p.X + 3, p.Y); fire('pointermove', p.X, p.Y + 3); fire('pointermove', p.X - 2, p.Y - 2);
      fire('pointerup', p.X, p.Y);
    };
    const p = t.screenOf(0);
    jitterTap(p); out.afterFirst = t.state.pending;
    jitterTap(p); out.cell0 = t.state.board[0];
    const q = t.screenOf(5);
    fire('pointerdown', q.X, q.Y);
    for (let k = 1; k <= 6; k++) fire('pointermove', q.X + k * 10, q.Y);
    fire('pointerup', q.X + 60, q.Y);
    out.afterDrag = { pending: t.state.pending, placed: t.state.board.filter(Boolean).length };
  `);
  assert.deepEqual(out.errors, []);
  assert.equal(out.afterFirst, 0);
  assert.equal(out.cell0, 'X');
  assert.deepEqual(out.afterDrag, { pending: -1, placed: 1 });
});

test('modes, computer turn and stale move', { skip: !chromeAvailable() && 'Chrome not found' }, async () => {
  const out = await runScenario(`
    const t = window.qubicTest, tap = p => t.tapAt(p.X, p.Y), wait = ms => new Promise(r => setTimeout(r, ms));
    const sheet = document.getElementById('sheet');
    out.firstLaunchSheet = !sheet.hidden;
    document.querySelector('[data-mode="medium"]').click();
    out.sheetAfterPick = !sheet.hidden;
    out.mode = document.getElementById('mode').textContent;
    out.saved = localStorage.getItem('qubic.mode');
    tap(t.screenOf(0)); tap(t.screenOf(0));
    out.thinking = document.getElementById('status').textContent;
    await wait(1500);
    out.oCount = t.state.board.filter(v => v === 'O').length;
    out.afterComputer = document.getElementById('status').textContent;
    document.getElementById('new').click();
    document.getElementById('sheet-backdrop').click();
    out.piecesAfterCancel = t.state.board.filter(Boolean).length;
    const e = t.state.board.findIndex((v, i) => !v && i < 16);
    tap(t.screenOf(e)); tap(t.screenOf(e));
    out.thinkingBeforeRestart = t.state.thinking;
    document.getElementById('new').click();
    document.querySelector('[data-mode="easy"]').click();
    await wait(1500);
    out.piecesAfterStaleRestart = t.state.board.filter(Boolean).length;
    out.modeAfterRestart = document.getElementById('mode').textContent;
  `);
  assert.deepEqual(out.errors, []);
  assert.equal(out.firstLaunchSheet, true);
  assert.equal(out.sheetAfterPick, false);
  assert.equal(out.mode, 'vs Computer · Medium');
  assert.equal(out.saved, 'medium');
  assert.equal(out.thinking, 'Computer is thinking…');
  assert.equal(out.oCount, 1);
  assert.equal(out.afterComputer, 'Your turn · layer 1');
  assert.equal(out.piecesAfterCancel, 2);
  assert.equal(out.thinkingBeforeRestart, true);
  assert.equal(out.piecesAfterStaleRestart, 0);
  assert.equal(out.modeAfterRestart, 'vs Computer · Easy');
});

test('taps during the computer wait do not add or hasten computer moves', { skip: !chromeAvailable() && 'Chrome not found' }, async () => {
  const out = await runScenario(`
    const t = window.qubicTest, tap = p => t.tapAt(p.X, p.Y), wait = ms => new Promise(r => setTimeout(r, ms));
    const os = () => t.state.board.filter(v => v === 'O').length;
    document.querySelector('[data-mode="hard"]').click();
    tap(t.screenOf(0)); tap(t.screenOf(0));
    await wait(100);
    tap(t.badgeOf(0)); tap({ X: 2, Y: 2 });
    await wait(1500);
    out.oneO = os();
    const e = t.state.board.findIndex((v, i) => !v && i < 16);
    tap(t.screenOf(e)); tap(t.screenOf(e));
    await wait(200);
    out.after200 = os();
    await wait(1000);
    out.after1200 = os();
  `);
  assert.deepEqual(out.errors, []);
  assert.equal(out.oneO, 1);
  assert.equal(out.after200, 1);
  assert.equal(out.after1200, 2);
});
