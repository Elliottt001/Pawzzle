export function shouldInitializeQuizMessages({
  hasStarted,
  phase,
  hasInitializedQuiz,
}: {
  hasStarted: boolean;
  phase: 'quiz' | 'chat' | 'survey' | 'result';
  hasInitializedQuiz: boolean;
}) {
  return hasStarted && phase === 'quiz' && !hasInitializedQuiz;
}
