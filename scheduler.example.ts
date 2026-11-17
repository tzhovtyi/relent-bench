export class CancelledError extends Error {
  constructor() {
    super("cancelled");
    this.name = "CancelledError";
  }
}

// Scheduling API ещё не во всех lib.dom.d.ts — отсюда локальное объявление
declare const scheduler: { yield?: () => Promise<void> } | undefined;

export async function yieldToMain(): Promise<void> {
  if (typeof scheduler === "object" && typeof scheduler?.yield === "function") {
    await scheduler.yield();
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export async function run<T>(
  gen: Generator<void, T, void>,
  opts: { signal: AbortSignal; budgetMs?: number; checkEvery?: number },
): Promise<T> {
  const { signal, budgetMs = 40, checkEvery = 8 } = opts;

  while (true) {
    const deadline = performance.now() + budgetMs;
    do {
      for (let n = 0; n < checkEvery; n++) {
        const step = gen.next();
        if (step.done) return step.value;
      }
    } while (performance.now() < deadline);

    await yieldToMain();
    if (signal.aborted) {
      gen.return(undefined as T);
      throw new CancelledError();
    }
  }
}

function* processLargeCSV(): Generator<void, void, void> {
  // тело таски: yield между порциями работы
}

const myHardTask = () => {};

// runTask(myHardTask); // нельзя из-за run to completion принципа
// нужен генератор, который сам отдаёт управление:
export const example = { processLargeCSV, myHardTask };
