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
