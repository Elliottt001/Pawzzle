import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStreamingFrames, getStreamingTickMs } from './streaming.ts';

test('empty text produces no streaming frames', () => {
  assert.deepEqual(buildStreamingFrames(''), []);
});

test('short text reveals one character at a time', () => {
  assert.deepEqual(buildStreamingFrames('你好'), ['你', '你好']);
});

test('chinese text streaming frames only move forward', () => {
  const text = '请继续描述你的生活节奏';
  const frames = buildStreamingFrames(text);

  assert.equal(frames.length > 1, true);
  assert.equal(frames.at(-1), text);

  for (let index = 1; index < frames.length; index += 1) {
    assert.equal(frames[index].startsWith(frames[index - 1]), true);
    assert.equal(frames[index].length > frames[index - 1].length, true);
  }
});

test('longer text streams faster than short text', () => {
  assert.equal(getStreamingTickMs(12) > getStreamingTickMs(120), true);
});
