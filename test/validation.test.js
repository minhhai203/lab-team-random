import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLists, topicCode } from '../src/validation.js';

test('detects duplicate teams ignoring case, extra whitespace and Unicode representation', () => {
  const result=validateLists('  Đội   Ánh Dương  \nĐội khác\n\nđội Ánh Dương', 'D01\nD02');
  assert.deepEqual(result.teams.map(x=>x.lines), [[1,4]]);
  assert.deepEqual(result.topics, []);
});
test('compares topic codes even when their descriptions differ', () => {
  const result=validateLists('A\nB', 'D01 - Đề một\nD02\nd01: Đề khác\nD-03 | Tên A\nD-03 - Tên B');
  assert.deepEqual(result.topics.map(x=>({label:x.label,lines:x.lines})), [
    {label:'D01',lines:[1,3]}, {label:'D-03',lines:[4,5]}
  ]);
});
test('accepts distinct entries and preserves hyphens inside codes', () => {
  assert.equal(topicCode('D-01 - Tên đề'), 'D-01');
  assert.deepEqual(validateLists('Nhóm 1\nNhóm 2','D-01 - Một\nD-02 - Hai'), {teams:[],topics:[]});
});
