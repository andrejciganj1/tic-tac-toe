// tests/geometry.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadQubic } from './load.mjs';
const Q = loadQubic('geometry');

test('cell centres', () => {
  assert.deepEqual([...Q.cellCenter(0)], [-1.5, 1.5, -1.5]);
  assert.deepEqual([...Q.cellCenter(63)], [1.5, -1.5, 1.5]);
});

test('no rotation is identity and the origin projects to the camera centre', () => {
  const cam = Q.makeCamera({ w: 316, h: 470, yaw: 0, pitch: 0 });
  assert.deepEqual([...Q.rotate(cam, [1, 2, 3])].map(v => +v.toFixed(9)), [1, 2, 3]);
  const p = Q.project(cam, [0, 0, 0]);
  assert.equal(p.X, cam.cx); assert.equal(p.Y, cam.cy); assert.equal(cam.cx, 316 / 2 + Q.BADGE_R);
});

test('nearer points project larger', () => {
  const cam = Q.makeCamera({ w: 316, h: 470, yaw: 0, pitch: 0 });
  assert.ok(Q.project(cam, [0, 0, -1]).s > Q.project(cam, [0, 0, 1]).s);
});

test('pitch is clamped', () => {
  assert.equal(Q.clampPitch(2), 1.3); assert.equal(Q.clampPitch(-2), -1.3); assert.equal(Q.clampPitch(0.4), 0.4);
});

test('pickCell picks the nearest centre within radius', () => {
  const hits = [{ i: 1, X: 10, Y: 10, r: 8 }, { i: 2, X: 20, Y: 10, r: 8 }];
  assert.equal(Q.pickCell(hits, 14, 10), 1);
  assert.equal(Q.pickCell(hits, 16, 10), 2);
  assert.equal(Q.pickCell(hits, 100, 100), -1);
  assert.equal(Q.pickCell([], 0, 0), -1);
});

test('spreadBadges keeps order, spacing and bounds', () => {
  const ys = Q.spreadBadges([100, 105, 300, 302], 34, 20, 380);
  for (let k = 1; k < 4; k++) assert.ok(ys[k] - ys[k - 1] >= 34);
  assert.ok(ys[0] >= 20 && ys[3] <= 380);
  const low = Q.spreadBadges([370, 372, 374, 376], 34, 20, 380);
  assert.ok(low[3] <= 380 && low[0] >= 20);
});

test('spreadBadges is indexed like the input even when input is unsorted', () => {
  const ys = Q.spreadBadges([300, 100, 105, 302], 34, 20, 380);
  const sorted = [1, 2, 0, 3].map(k => ys[k]);
  for (let k = 1; k < 4; k++) assert.ok(sorted[k] - sorted[k - 1] >= 34);
  assert.ok(ys[1] < ys[2] && ys[2] < ys[0] && ys[0] < ys[3]);
  assert.ok(Math.min(...ys) >= 20 && Math.max(...ys) <= 380);
});
