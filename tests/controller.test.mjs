// tests/controller.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadQubic } from './load.mjs';
const Q = loadQubic('rules', 'controller');

test('new game defaults', () => {
  const s = Q.createGame('pvp');
  assert.equal(s.turn, 'X'); assert.equal(s.activeLayer, 0); assert.equal(s.pending, -1);
  assert.equal(s.last, -1); assert.equal(s.over, false); assert.equal(s.thinking, false);
  assert.equal(s.board.length, 64); assert.ok(s.board.every(v => v === ''));
});

test('first tap selects, second tap places', () => {
  const s = Q.createGame('pvp');
  assert.equal(Q.tapCell(s, 5), 'selected'); assert.equal(s.pending, 5); assert.equal(s.board[5], '');
  assert.equal(Q.tapCell(s, 5), 'placed');
  assert.equal(s.board[5], 'X'); assert.equal(s.turn, 'O'); assert.equal(s.last, 5); assert.equal(s.pending, -1);
});

test('tapping another cell moves the selection; other layers and filled cells are ignored', () => {
  const s = Q.createGame('pvp');
  Q.tapCell(s, 5); Q.tapCell(s, 6); assert.equal(s.pending, 6);
  assert.equal(Q.tapCell(s, 20), 'ignored'); assert.equal(s.pending, 6);
  Q.tapCell(s, 6); Q.tapCell(s, 7); Q.tapCell(s, 7);
  assert.equal(Q.tapCell(s, 6), 'ignored');
});

test('selectLayer and clearSelection clear the pending cell', () => {
  const s = Q.createGame('pvp');
  Q.tapCell(s, 5); Q.selectLayer(s, 2);
  assert.equal(s.activeLayer, 2); assert.equal(s.pending, -1);
  Q.tapCell(s, 40); Q.clearSelection(s); assert.equal(s.pending, -1);
});

test('2-player status text', () => {
  const s = Q.createGame('pvp');
  assert.equal(Q.statusText(s), "X's turn · layer 1");
  Q.selectLayer(s, 1); Q.tapCell(s, 16);
  assert.equal(Q.statusText(s), 'X: tap again to place');
  Q.tapCell(s, 16);
  assert.equal(Q.statusText(s), "O's turn · layer 2");
});

test('win on the last empty cell beats draw', () => {
  const s = Q.createGame('pvp');
  s.board = Array(64).fill('X'); s.board[0] = s.board[1] = s.board[2] = 'O'; s.board[3] = '';
  s.turn = 'O';
  Q.tapCell(s, 3); Q.tapCell(s, 3);
  assert.equal(s.over, true);
  assert.deepEqual([...s.winLine].sort((a, b) => a - b), [0, 1, 2, 3]);
  assert.equal(Q.statusText(s), 'O wins');
});

test('full board with no line is a draw', () => {
  const s = Q.createGame('pvp');
  s.board = Array(64).fill('X'); s.board[3] = ''; s.turn = 'O';
  Q.tapCell(s, 3); Q.tapCell(s, 3);
  assert.equal(s.over, true); assert.equal(s.winLine, null); assert.equal(Q.statusText(s), 'Draw');
});

test('vs computer: thinking, cell taps ignored, computer move applied', () => {
  const s = Q.createGame('medium');
  assert.equal(Q.statusText(s), 'Your turn · layer 1');
  Q.tapCell(s, 0);
  assert.equal(Q.statusText(s), 'You: tap again to place');
  Q.tapCell(s, 0);
  assert.equal(s.thinking, true); assert.equal(Q.statusText(s), 'Computer is thinking…');
  assert.equal(Q.tapCell(s, 1), 'ignored');
  assert.equal(Q.applyComputerMove(s, 20, s.gen), true);
  assert.equal(s.board[20], 'O'); assert.equal(s.thinking, false); assert.equal(s.turn, 'X');
  assert.equal(Q.statusText(s), 'Your turn · layer 1');
});

test('vs computer end texts', () => {
  const s = Q.createGame('easy');
  s.board[0] = s.board[1] = s.board[2] = 'X';
  Q.tapCell(s, 3); Q.tapCell(s, 3);
  assert.equal(Q.statusText(s), 'You win'); assert.equal(s.thinking, false);
  const t = Q.createGame('easy');
  t.board[16] = t.board[17] = t.board[18] = 'O';
  Q.tapCell(t, 0); Q.tapCell(t, 0);
  Q.applyComputerMove(t, 19, t.gen);
  assert.equal(Q.statusText(t), 'Computer wins');
});

test('stale computer move is ignored', () => {
  const s = Q.createGame('hard');
  Q.tapCell(s, 0); Q.tapCell(s, 0);
  const g = s.gen;
  Q.restart(s, 'easy');
  assert.equal(s.gen, g + 1); assert.equal(s.mode, 'easy'); assert.equal(s.thinking, false);
  assert.equal(Q.applyComputerMove(s, 20, g), false);
  assert.ok(s.board.every(v => v === ''));
});

test('modeLabel and parseSavedMode', () => {
  assert.equal(Q.modeLabel('pvp'), '2 players');
  assert.equal(Q.modeLabel('easy'), 'vs Computer · Easy');
  assert.equal(Q.modeLabel('medium'), 'vs Computer · Medium');
  assert.equal(Q.modeLabel('hard'), 'vs Computer · Hard');
  for (const m of ['pvp', 'easy', 'medium', 'hard']) assert.equal(Q.parseSavedMode(m), m);
  for (const v of [null, undefined, '', 'foo', 'HARD']) assert.equal(Q.parseSavedMode(v), null);
});
