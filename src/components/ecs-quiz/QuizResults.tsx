import { ButtonVariants } from '@/components/starwind/button';
import { ECS_TOPICS, EXAM_PASS_MARK, scoreQuiz } from '@/lib/ecs-quiz';
import type { QuizSession } from './EcsQuiz';
import { correctTextClass, formatDuration, incorrectTextClass, OPTION_LETTERS, panelClass } from './shared';

interface QuizResultsProps {
  session: QuizSession;
  onReviewIds: (ids: string[]) => void;
  onRestart: () => void;
}

export default function QuizResults({ session, onReviewIds, onRestart }: QuizResultsProps) {
  const { mode, items, answers, startedAt, finishedAt } = session;
  const isExam = mode === 'exam';

  // Exams are marked out of every question; practice only counts what was answered before finishing
  const marked = items
    .map((item, index) => ({ item, answer: answers[index] }))
    .filter(({ answer }) => isExam || answer !== null);
  const score = scoreQuiz(
    marked.map(({ item }) => item),
    marked.map(({ answer }) => answer)
  );
  const total = marked.length;
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);
  const passed = score >= EXAM_PASS_MARK;
  const incorrect = marked.filter(({ item, answer }) => answer !== item.answerIndex);

  const topicBreakdown = ECS_TOPICS.map(({ name }) => {
    const topicItems = marked.filter(({ item }) => item.question.topic === name);
    return {
      name,
      total: topicItems.length,
      correct: topicItems.filter(({ item, answer }) => answer === item.answerIndex).length
    };
  }).filter((topic) => topic.total > 0);

  return (
    <div className="flex flex-col gap-6">
      <section className={`${panelClass} items-center text-center`} aria-live="polite">
        <h3 className="font-heading text-xl font-semibold">
          {isExam ? 'Mock exam results' : mode === 'review' ? 'Missed questions results' : 'Practice results'}
        </h3>
        <p className="font-heading text-5xl font-bold tabular-nums">
          {score}
          <span className="text-3xl text-muted-foreground"> / {total}</span>
        </p>
        <p className="text-muted-foreground">
          {percent}% correct{finishedAt !== null && ` in ${formatDuration(finishedAt - startedAt)}`}
        </p>
        {isExam && (
          <p
            className={`rounded-full px-4 py-1 font-semibold ${passed ? 'bg-success text-success-foreground' : 'bg-error text-error-foreground'}`}
          >
            {passed ? 'Pass' : `Not a pass yet. You need ${EXAM_PASS_MARK} correct.`}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {incorrect.length > 0 && (
            <button
              type="button"
              className={ButtonVariants.button({ variant: 'primary' })}
              onClick={() => onReviewIds(incorrect.map(({ item }) => item.question.id))}
            >
              Practise the {incorrect.length} you missed
            </button>
          )}
          <button type="button" className={ButtonVariants.button({ variant: 'outline' })} onClick={onRestart}>
            Back to start
          </button>
        </div>
      </section>

      {topicBreakdown.length > 1 && (
        <section className={panelClass}>
          <h3 className="font-heading text-lg font-semibold">By topic</h3>
          <ul className="flex flex-col gap-2">
            {topicBreakdown.map((topic) => (
              <li key={topic.name} className="flex items-center justify-between gap-4">
                <span>{topic.name}</span>
                <span
                  className={`tabular-nums ${topic.correct === topic.total ? correctTextClass : 'text-muted-foreground'}`}
                >
                  {topic.correct} / {topic.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {incorrect.length > 0 && (
        <section className={panelClass}>
          <h3 className="font-heading text-lg font-semibold">Questions to review</h3>
          <ol className="flex flex-col gap-6">
            {incorrect.map(({ item, answer }) => (
              <li key={item.question.id} className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  {item.question.topic} · Question {item.question.id}
                </p>
                <p className="font-medium">{item.question.question}</p>
                <p className={incorrectTextClass}>
                  Your answer: {answer === null ? 'Not answered' : `${OPTION_LETTERS[answer]}. ${item.options[answer]}`}
                </p>
                <p className={correctTextClass}>
                  Correct answer: {OPTION_LETTERS[item.answerIndex]}. {item.options[item.answerIndex]}
                </p>
                {item.question.explanation && <p className="text-muted-foreground">{item.question.explanation}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
