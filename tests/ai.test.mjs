import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadQubic, boardOf } from './load.mjs';
const Q = loadQubic('rules', 'controller', 'ai');
const LEVELS = ['easy', 'medium', 'hard'];
const pick = (b, me, level, seed = 1) => Q.chooseMove(b, me, level, { rng: Q.makeRng(seed) });

test('threatCells', () => {
  assert.deepEqual([...Q.threatCells(boardOf([0, 1, 2], []), 'X')], [3]);
  assert.deepEqual([...Q.threatCells(boardOf([0, 1, 2], [3]), 'X')], []);
});

for (const level of ['easy', 'medium']) {
  test(`${level} takes a win`, () => assert.equal(pick(boardOf([0, 1, 2], [16, 17, 32]), 'X', level), 3));
  test(`${level} blocks a three`, () => assert.equal(pick(boardOf([0, 1, 2], [16, 17]), 'O', level), 3));
  test(`${level} prefers winning to blocking`, () => assert.equal(pick(boardOf([0, 1, 2], [16, 17, 18]), 'O', level), 19));
  test(`${level} plays the only empty cell and leaves the board alone`, () => {
    const b = Array.from({ length: 64 }, (_, i) => (i % 2 ? 'X' : 'O')); b[40] = '';
    const copy = b.slice();
    assert.equal(pick(b, 'X', level), 40); assert.deepEqual(b, copy);
  });
}

test('easy varies its opening across seeds', () => {
  const moves = new Set([...Array(20).keys()].map(s => pick(Array(64).fill(''), 'X', 'easy', s)));
  assert.ok(moves.size >= 3);
});

test('medium makes a fork', () => assert.equal(pick(boardOf([0, 1, 6, 10], [48, 51, 60, 63]), 'X', 'medium'), 2));
test('medium blocks a fork', () => assert.equal(pick(boardOf([0, 1, 6, 10], [51, 60, 63]), 'O', 'medium'), 2));
