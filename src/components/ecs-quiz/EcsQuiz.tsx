import {
  buildMockExam,
  buildPracticeQuiz,
  buildReviewQuiz,
  EXAM_DURATION_MINUTES,
  type EcsQuestion,
  type QuizItem
} from '@/lib/ecs-quiz';
import { getMissedEcsQuestions, setMissedEcsQuestions } from '@/lib/local-storage';
import { useEffect, useRef, useState } from 'preact/hooks';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';
import QuizSetup, { type PracticeOptions } from './QuizSetup';

export type QuizMode = 'practice' | 'exam' | 'review';

export interface QuizSession {
  mode: QuizMode;
  items: QuizItem[];
  /** Selected option index per item (in shuffled order), or null if unanswered. */
  answers: (number | null)[];
  index: number;
  startedAt: number;
  /** Time the exam ends; null for untimed modes. */
  deadline: number | null;
  finishedAt: number | null;
}

interface EcsQuizProps {
  questions: EcsQuestion[];
}

export default function EcsQuiz({ questions }: EcsQuizProps) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Missed questions live in local storage, so load them after hydration
  useEffect(() => setMissedIds(getMissedEcsQuestions()), []);

  // Keep the top of the quiz in view when moving between screens and questions
  useEffect(() => {
    const container = containerRef.current;
    // Allow for the sticky navbar, which the scroll margin already accounts for
    if (container && container.getBoundingClientRect().top < parseFloat(getComputedStyle(container).scrollMarginTop)) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [session?.index, session?.finishedAt, session === null]);

  function updateMissed(results: { id: string; correct: boolean }[]) {
    const next = new Set(missedIds);
    for (const { id, correct } of results) {
      if (correct) next.delete(id);
      else next.add(id);
    }
    const ids = [...next];
    setMissedIds(ids);
    setMissedEcsQuestions(ids);
  }

  function start(mode: QuizMode, items: QuizItem[]) {
    if (items.length === 0) return;
    const now = Date.now();
    setSession({
      mode,
      items,
      answers: items.map(() => null),
      index: 0,
      startedAt: now,
      deadline: mode === 'exam' ? now + EXAM_DURATION_MINUTES * 60_000 : null,
      finishedAt: null
    });
  }

  function selectAnswer(optionIndex: number) {
    if (!session || session.finishedAt) return;
    const { mode, items, answers, index } = session;

    // Practice answers are locked in and marked immediately; exam answers can change until finished
    if (mode !== 'exam') {
      if (answers[index] !== null) return;
      const item = items[index];
      updateMissed([{ id: item.question.id, correct: optionIndex === item.answerIndex }]);
    }

    const nextAnswers = [...answers];
    nextAnswers[index] = optionIndex;
    setSession({ ...session, answers: nextAnswers });
  }

  function goTo(index: number) {
    if (!session) return;
    setSession({ ...session, index: Math.max(0, Math.min(index, session.items.length - 1)) });
  }

  function finish() {
    if (!session || session.finishedAt) return;
    if (session.mode === 'exam') {
      // Unanswered exam questions count as missed
      updateMissed(
        session.items.map((item, i) => ({ id: item.question.id, correct: session.answers[i] === item.answerIndex }))
      );
    }
    setSession({ ...session, finishedAt: Date.now() });
  }

  function startPractice({ topics, limit }: PracticeOptions) {
    start('practice', buildPracticeQuiz(questions, topics, limit));
  }

  function startReview(ids: string[]) {
    start('review', buildReviewQuiz(questions, ids));
  }

  function clearMissed() {
    setMissedIds([]);
    setMissedEcsQuestions([]);
  }

  // Ignore stored IDs for questions that no longer exist in the bank
  const knownMissedIds = missedIds.filter((id) => questions.some((question) => question.id === id));

  return (
    <div ref={containerRef} className="scroll-mt-24">
      {session === null ? (
        <QuizSetup
          questions={questions}
          missedCount={knownMissedIds.length}
          onStartExam={() => start('exam', buildMockExam(questions))}
          onStartPractice={startPractice}
          onStartReview={() => startReview(knownMissedIds)}
          onClearMissed={clearMissed}
        />
      ) : session.finishedAt === null ? (
        <QuizQuestion
          session={session}
          onSelect={selectAnswer}
          onNavigate={goTo}
          onFinish={finish}
          onQuit={() => setSession(null)}
        />
      ) : (
        <QuizResults session={session} onReviewIds={startReview} onRestart={() => setSession(null)} />
      )}
    </div>
  );
}
