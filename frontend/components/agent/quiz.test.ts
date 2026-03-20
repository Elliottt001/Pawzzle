import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldInitializeQuizMessages } from './quiz.ts';

test('quiz messages initialize only after the flow has started', () => {
  assert.equal(
    shouldInitializeQuizMessages({
      hasStarted: false,
      phase: 'quiz',
      hasInitializedQuiz: false,
    }),
    false
  );
});

test('quiz messages initialize when entering the started quiz phase', () => {
  assert.equal(
    shouldInitializeQuizMessages({
      hasStarted: true,
      phase: 'quiz',
      hasInitializedQuiz: false,
    }),
    true
  );
});

test('quiz messages do not reinitialize after the first injection', () => {
  assert.equal(
    shouldInitializeQuizMessages({
      hasStarted: true,
      phase: 'quiz',
      hasInitializedQuiz: true,
    }),
    false
  );
});
