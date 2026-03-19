import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getBubbleMotionPreset,
  getPhaseMotionPreset,
  getPressMotionPreset,
} from './motion.ts';

test('icon button presses more tightly than text actions', () => {
  const icon = getPressMotionPreset('icon');
  const text = getPressMotionPreset('text');

  assert.equal(icon.pressedScale < text.pressedScale, true);
  assert.equal(icon.releaseSpring.damping > 0, true);
});

test('user and ai bubbles use distinct entrance presets', () => {
  const user = getBubbleMotionPreset('user');
  const ai = getBubbleMotionPreset('ai');

  assert.notDeepEqual(user, ai);
  assert.equal(user.fromX > 0, true);
  assert.equal(ai.fromY > user.fromY, true);
});

test('phase preset stays lightweight and upward', () => {
  const phase = getPhaseMotionPreset();

  assert.equal(phase.fromY > 0, true);
  assert.equal(phase.duration <= 260, true);
});
