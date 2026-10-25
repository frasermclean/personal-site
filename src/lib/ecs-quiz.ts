/**
 * Topics in the ECS Health, Safety and Environmental Assessment, with the number of
 * questions drawn from each topic in the real 50 question assessment.
 */
export const ECS_TOPICS = [
  { name: 'General Health and Safety at Work', examQuestions: 6 },
  { name: 'Manual Handling Operations', examQuestions: 4 },
  { name: 'Reporting Accidents', examQuestions: 3 },
  { name: 'Personal Protective Equipment at Work', examQuestions: 4 },
  { name: 'Health and Hygiene', examQuestions: 3 },
  { name: 'Fire and Emergency', examQuestions: 9 },
  { name: 'Work at Height', examQuestions: 5 },
  { name: 'Work Equipment', examQuestions: 4 },
  { name: 'Special Site Hazards', examQuestions: 3 },
  { name: 'Electrotechnical', examQuestions: 6 },
  { name: 'Environmental', examQuestions: 3 }
] as const;

export type EcsTopic = (typeof ECS_TOPICS)[number]['name'];

export const EXAM_QUESTION_COUNT = ECS_TOPICS.reduce((total, topic) => total + topic.examQuestions, 0);
export const EXAM_PASS_MARK = 43;
export const EXAM_DURATION_MINUTES = 30;

export interface EcsQuestion {
  id: string;
  topic: EcsTopic;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string | null;
}

/** A question prepared for a single attempt, with its options in a random order. */
export interface QuizItem {
  question: EcsQuestion;
  options: string[];
  answerIndex: number;
}

/**
 * Return a shuffled copy of the given items (Fisher-Yates).
 * @param random Random number generator returning values in [0, 1), injectable for testing.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Prepare a question for an attempt by shuffling its options, as the real assessment does.
 */
export function toQuizItem(question: EcsQuestion, random: () => number = Math.random): QuizItem {
  const order = shuffle(
    question.options.map((_, index) => index),
    random
  );
  return {
    question,
    options: order.map((index) => question.options[index]),
    answerIndex: order.indexOf(question.answerIndex)
  };
}

/**
 * Build a practice quiz from the given topics in a random order.
 * @param limit Maximum number of questions, or all matching questions if omitted.
 */
export function buildPracticeQuiz(
  questions: readonly EcsQuestion[],
  topics: readonly string[],
  limit?: number,
  random: () => number = Math.random
): QuizItem[] {
  const pool = shuffle(
    questions.filter((question) => topics.includes(question.topic)),
    random
  );
  return pool.slice(0, limit ?? pool.length).map((question) => toQuizItem(question, random));
}

/**
 * Build a mock exam using the same number of questions per topic as the real assessment.
 */
export function buildMockExam(questions: readonly EcsQuestion[], random: () => number = Math.random): QuizItem[] {
  const picked = ECS_TOPICS.flatMap((topic) =>
    shuffle(
      questions.filter((question) => question.topic === topic.name),
      random
    ).slice(0, topic.examQuestions)
  );
  return shuffle(picked, random).map((question) => toQuizItem(question, random));
}

/**
 * Build a quiz from specific question IDs (e.g. previously missed questions). Unknown IDs are ignored.
 */
export function buildReviewQuiz(
  questions: readonly EcsQuestion[],
  ids: readonly string[],
  random: () => number = Math.random
): QuizItem[] {
  const idSet = new Set(ids);
  return shuffle(
    questions.filter((question) => idSet.has(question.id)),
    random
  ).map((question) => toQuizItem(question, random));
}

/**
 * Count the correctly answered items.
 * @param answers Selected option index per item (in shuffled order), or null if unanswered.
 */
export function scoreQuiz(items: readonly QuizItem[], answers: readonly (number | null)[]): number {
  return items.filter((item, index) => answers[index] === item.answerIndex).length;
}
