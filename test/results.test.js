import { test } from 'node:test';
import assert from 'node:assert/strict';
import {teamAssignments, itemUnderNeedle} from '../src/results.js';

test('revealed results pair each team with its original topic, not the display position', () => {
  const groups=[{topic:'B7 - Chủ đề bảy',teams:['A','B']},{topic:'A2 - Chủ đề hai',teams:['C']},{topic:'C3',teams:[]}];
  assert.deepEqual(teamAssignments(groups,1),[{team:'A',topic:'B7 - Chủ đề bảy'},{team:'B',topic:'B7 - Chủ đề bảy'}]);
  assert.deepEqual(teamAssignments(groups),[{team:'A',topic:'B7 - Chủ đề bảy'},{team:'B',topic:'B7 - Chủ đề bảy'},{team:'C',topic:'A2 - Chủ đề hai'}]);
});
test('reel tick occurs when the boundary crosses the needle', () => {
  assert.equal(itemUnderNeedle(0,160),0);
  assert.equal(itemUnderNeedle(79,160),0);
  assert.equal(itemUnderNeedle(80,160),1);
  assert.equal(itemUnderNeedle(240,160),2);
});
