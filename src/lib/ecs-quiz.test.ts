import { describe, expect, it } from 'vitest';
import questionData from '../data/ecs-questions.json';
import {
  buildMockExam,
  buildPracticeQuiz,
  buildReviewQuiz,
  ECS_TOPICS,
  EXAM_QUESTION_COUNT,
  scoreQuiz,
  shuffle,
  toQuizItem,
  type EcsQuestion
} from './ecs-quiz';

const questions = questionData as EcsQuestion[];

/** Deterministic pseudo-random generator so tests are repeatable. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
}

describe('question data', () => {
  it('only uses known topics', () => {
    const topicNames: string[] = ECS_TOPICS.map((topic) => topic.name);
    expect(questions.every((question) => topicNames.includes(question.topic))).toBe(true);
  });

  it('has enough questions per topic for a mock exam', () => {
    for (const topic of ECS_TOPICS) {
      const count = questions.filter((question) => question.topic === topic.name).length;
      expect(count).toBeGreaterThanOrEqual(topic.examQuestions);
    }
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input, seededRandom(1));
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual(input);
  });
});

describe('toQuizItem', () => {
  it('keeps the correct answer pointing at the same option text', () => {
    const random = seededRandom(42);
    for (const question of questions) {
      const item = toQuizItem(question, random);
      expect(item.options).toHaveLength(question.options.length);
      expect(item.options[item.answerIndex]).toBe(question.options[question.answerIndex]);
    }
  });
});

describe('buildMockExam', () => {
  it('matches the real assessment topic mix', () => {
    const exam = buildMockExam(questions, seededRandom(7));
    expect(exam).toHaveLength(EXAM_QUESTION_COUNT);
    expect(EXAM_QUESTION_COUNT).toBe(50);
    expect(new Set(exam.map((item) => item.question.id)).size).toBe(exam.length);
    for (const topic of ECS_TOPICS) {
      expect(exam.filter((item) => item.question.topic === topic.name)).toHaveLength(topic.examQuestions);
    }
  });
});

describe('buildPracticeQuiz', () => {
  it('only includes selected topics and respects the limit', () => {
    const quiz = buildPracticeQuiz(questions, ['Work at Height'], 10, seededRandom(3));
    expect(quiz).toHaveLength(10);
    expect(quiz.every((item) => item.question.topic === 'Work at Height')).toBe(true);
  });

  it('includes every matching question when no limit is given', () => {
    const quiz = buildPracticeQuiz(questions, ['Environmental'], undefined, seededRandom(3));
    expect(quiz).toHaveLength(questions.filter((question) => question.topic === 'Environmental').length);
  });
});

describe('buildReviewQuiz', () => {
  it('includes only known requested IDs', () => {
    const quiz = buildReviewQuiz(questions, ['1.1', '6.12', 'does-not-exist'], seededRandom(5));
    expect(quiz.map((item) => item.question.id).sort()).toEqual(['1.1', '6.12']);
  });
});

describe('scoreQuiz', () => {
  it('counts only correct answers', () => {
    const quiz = buildPracticeQuiz(questions, ['Environmental'], 3, seededRandom(9));
    const answers = [quiz[0].answerIndex, (quiz[1].answerIndex + 1) % 4, null];
    expect(scoreQuiz(quiz, answers)).toBe(1);
  });
});
