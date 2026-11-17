import { Form, Level } from '../types';
import type { Executor } from '../types';

export const reference: Executor<Form.Plain> = {
  id: 'reference',
  level: Level.Reference,
  form: Form.Plain,
  run: async (implementation, input) => implementation(input),
};
