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

test('disabled buttons do not advertise active press feedback', () => {
  const icon = getPressMotionPreset('icon');
  const text = getPressMotionPreset('text');

  assert.equal(icon.disabledOpacity < 1, true);
  assert.equal(text.disabledOpacity < 1, true);
  assert.equal(icon.translateY <= 0, true);
});

test('cta buttons rebound more gently than icon buttons', () => {
  const cta = getPressMotionPreset('cta');
  const icon = getPressMotionPreset('icon');

  assert.equal(cta.releaseSpring.damping >= icon.releaseSpring.damping, true);
});

test('user and ai bubbles use distinct entrance presets', () => {
  const user = getBubbleMotionPreset('user');
  const ai = getBubbleMotionPreset('ai');

  assert.notDeepEqual(user, ai);
  assert.equal(user.fromX, 12);
  assert.equal(user.fromY, 6);
  assert.equal(ai.fromY, 14);
});

test('debug bubbles stay calmer than user and ai bubbles', () => {
  const debugPreset = getBubbleMotionPreset('debug');
  const userPreset = getBubbleMotionPreset('user');
  const aiPreset = getBubbleMotionPreset('ai');

  assert.equal(debugPreset.duration < aiPreset.duration, true);
  assert.equal(debugPreset.fromY, 6);
  assert.equal(userPreset.fromX > 0, true);
  assert.equal(aiPreset.fromY > debugPreset.fromY, true);
});

test('phase preset stays lightweight and upward', () => {
  const phase = getPhaseMotionPreset();

  assert.equal(phase.fromY, 12);
  assert.equal(phase.duration >= 180 && phase.duration <= 260, true);
  assert.equal('fromX' in phase, false);
});
