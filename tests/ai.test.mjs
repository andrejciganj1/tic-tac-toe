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

for (const level of LEVELS) {
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

test('hard finds a forced chain and wins against forced blocks', () => {
  const b = boardOf([25, 36, 44, 48, 49], [0, 14, 18, 57, 58]);
  const first = pick(b, 'X', 'hard');
  assert.ok([12, 51].includes(first));
  let won = false;
  for (let move = 0; move < 4 && !won; move++) {
    const x = move === 0 ? first : pick(b, 'X', 'hard');
    b[x] = 'X';
    if (Q.winningLine(b, x)) { won = true; break; }
    const t = Q.threatCells(b, 'X');
    assert.ok(t.length >= 1, 'every chain move must threaten');
    b[t[0]] = 'O';
  }
  assert.ok(won);
});

// The position is lost for O under a full search; 12 is the longest hold-out.
test('hard holds out longest against a forced chain', () => {
  assert.equal(pick(boardOf([25, 36, 44, 48, 49], [0, 14, 18, 57]), 'O', 'hard'), 12);
});

// Medium happens to play 12 in P3 and P4 (its best-scoring cell), so these two pin the search.
test('hard finds a chain that medium misses', () => {
  const b = boardOf([3, 12, 15, 36, 37, 44, 48, 51, 54, 60], [0, 6, 22, 24, 26, 28, 33, 35, 38, 57]);
  let won = false;
  for (let move = 0; move < 4 && !won; move++) {
    const x = pick(b, 'X', 'hard');
    b[x] = 'X';
    if (Q.winningLine(b, x)) { won = true; break; }
    const t = Q.threatCells(b, 'X');
    assert.ok(t.length >= 1, 'every chain move must threaten');
    b[t[0]] = 'O';
  }
  assert.ok(won);
});

test('hard finds the only defence when it is not the best-scoring cell', () => {
  assert.equal(pick(boardOf([3, 4, 10, 12, 15, 48], [5, 6, 8, 14, 63]), 'O', 'hard'), 37);
});

test('hard respects the deadline', () => {
  // Seeded self-play position where a full search takes about 90 ms; the clock runs 400x fast, so
  // the 3000 ms deadline is about 7.5 ms real. Without the deadline check this takes the full search.
  const b = boardOf([21, 25, 26, 41, 42, 51], [12, 22, 57, 59, 63]);
  const now = () => performance.now() * 400;
  const t0 = performance.now();
  const m = Q.chooseMove(b, 'O', 'hard', { rng: Q.makeRng(3), now, deadline: now() + 3000 });
  assert.ok(performance.now() - t0 < 50, `took ${performance.now() - t0} ms`);
  assert.equal(b[m], '');
});

const playGame = (levelX, levelO, seed) => {
  const b = Array(64).fill(''), rng = Q.makeRng(seed);
  let worst = 0;
  for (let n = 0, p = 'X'; n < 64; n++, p = Q.other(p)) {
    const t0 = performance.now();
    const i = Q.chooseMove(b, p, p === 'X' ? levelX : levelO, { rng });
    worst = Math.max(worst, performance.now() - t0);
    assert.equal(b[i], '');
    b[i] = p;
    if (Q.winningLine(b, i)) return { winner: p, worst };
  }
  return { winner: null, worst };
};

test('hard as O does not lose to easy, and every move is quick', () => {
  let losses = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const r = playGame('easy', 'hard', seed);
    if (r.winner === 'X') losses++;
    assert.ok(r.worst < 250, `move took ${r.worst} ms`);
  }
  assert.ok(losses <= 1, `hard lost ${losses} of 10`);
});

test('every level finishes a self-play game with legal moves', () => {
  for (const level of LEVELS) playGame(level, level, 7);
});
