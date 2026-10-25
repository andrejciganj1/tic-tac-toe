import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadQubic, boardOf } from './load.mjs';
const Q = loadQubic('rules');
const lrc = i => [Math.floor(i / 16), Math.floor(i / 4) % 4, i % 4];

test('idx maps layer, row, column', () => {
  assert.equal(Q.idx(0, 0, 0), 0);
  assert.equal(Q.idx(1, 2, 3), 27);
  assert.equal(Q.idx(3, 3, 3), 63);
});

test('76 lines of 4 distinct cells', () => {
  assert.equal(Q.LINES.length, 76);
  for (const L of Q.LINES) assert.equal(new Set(L).size, 4);
  assert.equal(new Set(Q.LINES.map(L => [...L].sort((a, b) => a - b).join())).size, 76);
});

test('48 straight lines, 24 plane diagonals, 4 space diagonals', () => {
  const kinds = { 1: 0, 2: 0, 3: 0 };
  for (const [a, b] of Q.LINES) {
    const A = lrc(a), B = lrc(b);
    kinds[A.filter((v, k) => v !== B[k]).length]++;
  }
  assert.deepEqual(kinds, { 1: 48, 2: 24, 3: 4 });
});

test('16 cells lie on 7 lines, the other 48 on 4', () => {
  const n = Q.LINES_AT.map(a => a.length);
  assert.equal(n.filter(x => x === 7).length, 16);
  assert.equal(n.filter(x => x === 4).length, 48);
  assert.equal(Q.LINES_AT[0].length, 7);
});

test('winningLine finds the space diagonal through 63', () => {
  const b = boardOf([0, 21, 42, 63], []);
  assert.deepEqual([...Q.winningLine(b, 63)].sort((a, b) => a - b), [0, 21, 42, 63]);
  assert.equal(Q.winningLine(b, 1), null);
});

test('three in a row is not a win', () => {
  assert.equal(Q.winningLine(boardOf([0, 1, 2], []), 2), null);
});

test('isFull and other', () => {
  assert.equal(Q.isFull(Array(64).fill('X')), true);
  assert.equal(Q.isFull(boardOf([0], [])), false);
  assert.equal(Q.other('X'), 'O');
  assert.equal(Q.other('O'), 'X');
});
