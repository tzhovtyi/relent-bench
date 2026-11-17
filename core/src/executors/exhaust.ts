import { Form, Level } from '../types';
import type { Executor } from '../types';

export const exhaust: Executor<Form.Generator> = {
  id: 'exhaust',
  level: Level.Exhaust,
  form: Form.Generator,
  run: async (implementation, input) => {
    const iterator = implementation(input);
    let step = iterator.next();
    while (!step.done) step = iterator.next();
    return step.value;
  },
};
