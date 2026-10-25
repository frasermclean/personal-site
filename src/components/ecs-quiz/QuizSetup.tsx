import { ButtonVariants } from '@/components/starwind/button';
import {
  ECS_TOPICS,
  EXAM_DURATION_MINUTES,
  EXAM_PASS_MARK,
  EXAM_QUESTION_COUNT,
  type EcsQuestion,
  type EcsTopic
} from '@/lib/ecs-quiz';
import { useState } from 'preact/hooks';
import { panelClass } from './shared';

export interface PracticeOptions {
  topics: EcsTopic[];
  /** Maximum number of questions, or undefined for all. */
  limit?: number;
}

interface QuizSetupProps {
  questions: EcsQuestion[];
  missedCount: number;
  onStartExam: () => void;
  onStartPractice: (options: PracticeOptions) => void;
  onStartReview: () => void;
  onClearMissed: () => void;
}

const LIMIT_OPTIONS = [10, 25, 50] as const;
const ALL_TOPICS: EcsTopic[] = ECS_TOPICS.map((topic) => topic.name);

export default function QuizSetup({
  questions,
  missedCount,
  onStartExam,
  onStartPractice,
  onStartReview,
  onClearMissed
}: QuizSetupProps) {
  const [topics, setTopics] = useState<EcsTopic[]>(ALL_TOPICS);
  const [limit, setLimit] = useState<number | undefined>(LIMIT_OPTIONS[0]);

  const topicCounts = new Map(
    ECS_TOPICS.map(({ name }) => [name, questions.filter((question) => question.topic === name).length])
  );
  const available = topics.reduce((total, topic) => total + (topicCounts.get(topic) ?? 0), 0);
  const practiceCount = Math.min(limit ?? available, available);

  function toggleTopic(topic: EcsTopic, checked: boolean) {
    // Keep topics in the guide's order regardless of click order
    setTopics(ALL_TOPICS.filter((name) => (name === topic ? checked : topics.includes(name))));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className={panelClass}>
        <h3 className="font-heading text-xl font-semibold">Mock exam</h3>
        <p className="text-muted-foreground">
          {EXAM_QUESTION_COUNT} questions in the same topic mix as the real assessment, with a {EXAM_DURATION_MINUTES}{' '}
          minute time limit. You need {EXAM_PASS_MARK} correct to pass. Answers are revealed at the end.
        </p>
        <div>
          <button type="button" className={ButtonVariants.button({ variant: 'primary' })} onClick={onStartExam}>
            Start mock exam
          </button>
        </div>
      </section>

      <section className={panelClass}>
        <h3 className="font-heading text-xl font-semibold">Practice</h3>
        <p className="text-muted-foreground">
          Pick the topics you want to work on. Each answer is marked straight away, with an explanation.
        </p>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 flex w-full items-center justify-between gap-4 font-medium">
            Topics
            <span className="flex gap-1">
              <button
                type="button"
                className={ButtonVariants.button({ variant: 'ghost', size: 'sm' })}
                onClick={() => setTopics(ALL_TOPICS)}
              >
                All
              </button>
              <button
                type="button"
                className={ButtonVariants.button({ variant: 'ghost', size: 'sm' })}
                onClick={() => setTopics([])}
              >
                None
              </button>
            </span>
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ECS_TOPICS.map(({ name }) => (
              <label key={name} className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 rounded text-primary focus:ring-primary/50"
                  checked={topics.includes(name)}
                  onChange={(event) => toggleTopic(name, event.currentTarget.checked)}
                />
                <span>
                  {name} <span className="text-sm text-muted-foreground">({topicCounts.get(name)})</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="mb-2 font-medium">Questions</legend>
          {[...LIMIT_OPTIONS, undefined].map((option) => (
            <button
              key={option ?? 'all'}
              type="button"
              aria-pressed={limit === option}
              className={ButtonVariants.button({ variant: limit === option ? 'secondary' : 'outline', size: 'sm' })}
              onClick={() => setLimit(option)}
            >
              {option ?? 'All'}
            </button>
          ))}
        </fieldset>

        <div>
          <button
            type="button"
            className={ButtonVariants.button({ variant: 'primary' })}
            disabled={practiceCount === 0}
            onClick={() => onStartPractice({ topics, limit })}
          >
            Start practice ({practiceCount} {practiceCount === 1 ? 'question' : 'questions'})
          </button>
        </div>
      </section>

      <section className={panelClass}>
        <h3 className="font-heading text-xl font-semibold">Missed questions</h3>
        <p className="text-muted-foreground">
          {missedCount === 0
            ? 'Questions you answer incorrectly are saved in this browser so you can go back over them.'
            : `You have ${missedCount} ${missedCount === 1 ? 'question' : 'questions'} you last answered incorrectly. Answer one correctly to remove it from this list.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ButtonVariants.button({ variant: 'primary' })}
            disabled={missedCount === 0}
            onClick={onStartReview}
          >
            Practise missed questions
          </button>
          <button
            type="button"
            className={ButtonVariants.button({ variant: 'outline' })}
            disabled={missedCount === 0}
            onClick={onClearMissed}
          >
            Clear list
          </button>
        </div>
      </section>
    </div>
  );
}
