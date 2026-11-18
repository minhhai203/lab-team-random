import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draw, lines } from '../src/draw.js';

test('assigns each team exactly once and balances arbitrary sizes', () => {
  for (let count = 1; count <= 40; count++) for (let n = 1; n <= 15; n++) {
    const teams = Array.from({length: count}, (_, i) => `team ${i}`);
    const topics = Array.from({length: n}, (_, i) => `topic ${i}`);
    const groups = draw(teams, topics, (max) => Math.floor(Math.random() * max));
    assert.deepEqual(groups.flatMap(g => g.teams).sort(), teams.sort());
    assert.equal(groups.length, n);
    const sizes = groups.map(g => g.teams.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  }
});
test('ignores blank lines and trims entries', () => assert.deepEqual(lines('  A \r\n\r\n B  '), ['A', 'B']));
