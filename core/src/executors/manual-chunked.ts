import { Form, Level } from '../types';
import type { Executor } from '../types';

const POINTS_PER_CHUNK = 20_000;

export const manualChunked: Executor<Form.Generator> = {
  id: `manual-chunked-${POINTS_PER_CHUNK}`,
  level: Level.ManualChunked,
  form: Form.Generator,
  run: (implementation, input) =>
    new Promise((resolve) => {
      const iterator = implementation(input);
      const runChunk = (): void => {
        for (let i = 0; i < POINTS_PER_CHUNK; i += 1) {
          const step = iterator.next();
          if (step.done) {
            resolve(step.value);
            return;
          }
        }
        setTimeout(runChunk, 0);
      };
      setTimeout(runChunk, 0);
    }),
};
