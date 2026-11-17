import { Form, Level } from '../types';
import type { Executor } from '../types';

declare const scheduler: { yield?: () => Promise<void> } | undefined;

const priorityYield =
  typeof scheduler === 'object' && typeof scheduler?.yield === 'function'
    ? scheduler.yield.bind(scheduler)
    : undefined;

export const schedulerYieldAvailable = priorityYield !== undefined;

const BUDGET_MS = 4;
const STEPS_PER_CLOCK_READ = 8;

function budgetedExecutor(
  mechanism: string,
  yieldToMain: () => Promise<void>,
): Executor<Form.Generator> {
  return {
    id: `budget-${BUDGET_MS}ms-steps-${STEPS_PER_CLOCK_READ}-${mechanism}`,
    level: Level.Evaluated,
    form: Form.Generator,
    run: async (implementation, input) => {
      const iterator = implementation(input);
      let deadline = performance.now() + BUDGET_MS;
      for (;;) {
        for (let index = 0; index < STEPS_PER_CLOCK_READ; index += 1) {
          const step = iterator.next();
          if (step.done) return step.value;
        }
        if (performance.now() >= deadline) {
          await yieldToMain();
          deadline = performance.now() + BUDGET_MS;
        }
      }
    },
  };
}

export const budgetedPriorityYield = budgetedExecutor('yield', () => {
  if (!priorityYield) throw new Error('scheduler.yield is unavailable');
  return priorityYield();
});

export const budgetedTimeout = budgetedExecutor(
  'timeout',
  () =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    }),
);
