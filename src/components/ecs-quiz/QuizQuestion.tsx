import { ButtonVariants } from '@/components/starwind/button';
import { useEffect, useState } from 'preact/hooks';
import type { QuizSession } from './EcsQuiz';
import { formatDuration, incorrectTextClass, OPTION_LETTERS, panelClass } from './shared';

interface QuizQuestionProps {
  session: QuizSession;
  onSelect: (optionIndex: number) => void;
  onNavigate: (index: number) => void;
  onFinish: () => void;
  onQuit: () => void;
}

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'dimmed';

const optionStateClasses: Record<OptionState, string> = {
  idle: 'border-border bg-foreground/5 hover:bg-foreground/10 cursor-pointer',
  selected: 'border-primary bg-primary/10 cursor-pointer',
  correct: 'border-success bg-success/10',
  incorrect: 'border-error bg-error/10',
  dimmed: 'border-border bg-foreground/5 opacity-60'
};

export default function QuizQuestion({ session, onSelect, onNavigate, onFinish, onQuit }: QuizQuestionProps) {
  const { mode, items, answers, index, deadline } = session;
  const item = items[index];
  const selected = answers[index];
  const isExam = mode === 'exam';
  // Practice answers are marked as soon as they are chosen
  const revealed = !isExam && selected !== null;
  const isLast = index === items.length - 1;
  const unansweredCount = answers.filter((answer) => answer === null).length;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const remaining = deadline === null ? null : Math.max(0, deadline - now);
  const timeUp = remaining === 0;
  useEffect(() => {
    if (timeUp) onFinish();
  }, [timeUp]);

  function optionState(optionIndex: number): OptionState {
    if (!revealed) return selected === optionIndex ? 'selected' : 'idle';
    if (optionIndex === item.answerIndex) return 'correct';
    if (optionIndex === selected) return 'incorrect';
    return 'dimmed';
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            Question {index + 1} of {items.length}
          </span>
          <span className="flex items-center gap-3">
            {remaining !== null && (
              <span
                className={`font-mono tabular-nums ${remaining < 5 * 60_000 ? `font-semibold ${incorrectTextClass}` : ''}`}
                aria-label={`Time remaining ${formatDuration(remaining)}`}
              >
                {formatDuration(remaining)}
              </span>
            )}
            <button type="button" className={ButtonVariants.button({ variant: 'ghost', size: 'sm' })} onClick={onQuit}>
              Quit
            </button>
          </span>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {item.question.topic} · Question {item.question.id}
        </p>
        <h3 className="font-heading text-lg font-semibold md:text-xl">{item.question.question}</h3>

        <div className="flex flex-col gap-3">
          {item.options.map((option, optionIndex) => (
            <button
              key={`${item.question.id}-${optionIndex}`}
              type="button"
              aria-pressed={selected === optionIndex}
              disabled={revealed}
              className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-outline/50 ${optionStateClasses[optionState(optionIndex)]}`}
              onClick={() => onSelect(optionIndex)}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-foreground/10 text-sm font-semibold">
                {OPTION_LETTERS[optionIndex]}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div aria-live="polite">
          {revealed && (
            <div
              className={`flex flex-col gap-1 rounded-lg border-l-4 p-4 ${selected === item.answerIndex ? 'border-success bg-success/10' : 'border-error bg-error/10'}`}
            >
              <p className="font-semibold">
                {selected === item.answerIndex
                  ? 'Correct!'
                  : `Incorrect. The answer is ${OPTION_LETTERS[item.answerIndex]}.`}
              </p>
              {item.question.explanation && <p>{item.question.explanation}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {isExam ? (
            <>
              <span className="flex gap-2">
                <button
                  type="button"
                  className={ButtonVariants.button({ variant: 'outline' })}
                  disabled={index === 0}
                  onClick={() => onNavigate(index - 1)}
                >
                  Previous
                </button>
                {!isLast && (
                  <button
                    type="button"
                    className={ButtonVariants.button({ variant: 'primary' })}
                    onClick={() => onNavigate(index + 1)}
                  >
                    Next
                  </button>
                )}
              </span>
              <button
                type="button"
                className={ButtonVariants.button({ variant: isLast ? 'primary' : 'outline' })}
                onClick={onFinish}
              >
                Finish exam
              </button>
            </>
          ) : (
            <>
              <button type="button" className={ButtonVariants.button({ variant: 'outline' })} onClick={onFinish}>
                Finish early
              </button>
              <button
                type="button"
                className={ButtonVariants.button({ variant: 'primary' })}
                disabled={!revealed}
                onClick={() => (isLast ? onFinish() : onNavigate(index + 1))}
              >
                {isLast ? 'See results' : 'Next question'}
              </button>
            </>
          )}
        </div>
      </section>

      {isExam && (
        <nav className={panelClass} aria-label="Exam questions">
          <p className="text-sm text-muted-foreground">
            {unansweredCount === 0 ? 'All questions answered.' : `${unansweredCount} unanswered.`} Select a number to
            jump to that question.
          </p>
          <div className="grid grid-cols-10 gap-1.5">
            {items.map((_, itemIndex) => (
              <button
                key={itemIndex}
                type="button"
                aria-label={`Question ${itemIndex + 1}${answers[itemIndex] === null ? ', unanswered' : ', answered'}`}
                aria-current={itemIndex === index ? 'step' : undefined}
                className={`h-9 rounded-md border text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-outline/50 ${
                  itemIndex === index
                    ? 'border-primary ring-2 ring-primary'
                    : answers[itemIndex] === null
                      ? 'border-border hover:bg-muted'
                      : 'border-primary/40 bg-primary/15 hover:bg-primary/25'
                }`}
                onClick={() => onNavigate(itemIndex)}
              >
                {itemIndex + 1}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
