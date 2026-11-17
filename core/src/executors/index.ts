import type { AnyExecutor } from '../types';
import { exhaust } from './exhaust';
import { manualChunked } from './manual-chunked';
import { reference } from './reference';
import { budgetedPriorityYield, budgetedTimeout } from './scheduler';

export const executors: AnyExecutor[] = [
  reference,
  exhaust,
  manualChunked,
  budgetedPriorityYield,
  budgetedTimeout,
];

export function findExecutor(id: string): AnyExecutor {
  const found = executors.find((executor) => executor.id === id);
  if (!found) throw new Error(`unknown executor: ${id}`);
  return found;
}
