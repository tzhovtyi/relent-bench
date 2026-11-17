import { BlockKind, Form } from '../types';
import type {
  AnyExecutor,
  AnyScenario,
  BaselineBlock,
  BaselineRepeat,
  RepeatMetrics,
  ScenarioBlock,
  ScenarioRepeat,
} from '../types';
import { startLoad } from '../load/background';
import { nextFrames, recordFrames } from '../measure/frames';
import { bracket, frameMetrics } from '../measure/metrics';

export const WARMUP_REPEATS = 2;
export const RECORDED_REPEATS = 9;
export const BASELINE_REPEAT_MS = 1000;
const SETTLE_FRAMES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function measureWhile<Result>(
  iterations: number,
  frameIntervalMs: number,
  action: () => Promise<Result>,
): Promise<{ repeat: RepeatMetrics; result: Result }> {
  const stopFrames = recordFrames();
  const stopLoad = startLoad(iterations);
  await nextFrames(SETTLE_FRAMES);
  const start = performance.now();
  const result = await action();
  const end = performance.now();
  await nextFrames(SETTLE_FRAMES);
  stopLoad();
  const frameTimestamps = stopFrames();
  return {
    repeat: {
      ...frameMetrics(bracket(frameTimestamps, start, end), frameIntervalMs),
      durationMs: end - start,
    },
    result,
  };
}

export async function runBaselineBlock(
  scenario: AnyScenario,
  iterations: number,
  frameIntervalMs: number,
): Promise<BaselineBlock> {
  const repeats: BaselineRepeat[] = [];
  for (let i = 0; i < RECORDED_REPEATS; i += 1) {
    const { repeat } = await measureWhile(iterations, frameIntervalMs, () =>
      sleep(BASELINE_REPEAT_MS),
    );
    repeats.push(repeat);
  }
  return { kind: BlockKind.Baseline, scenarioId: scenario.id, repeats };
}

async function runScenarioRepeat(
  scenario: AnyScenario,
  executor: AnyExecutor,
  seed: number,
  iterations: number,
  frameIntervalMs: number,
): Promise<ScenarioRepeat> {
  const input = scenario.makeInput(seed, scenario.volume);
  const implementation = scenario.forms[executor.form as Form];
  const { repeat, result } = await measureWhile(iterations, frameIntervalMs, () =>
    executor.run(implementation, input),
  );
  return { ...repeat, hash: scenario.hash(result) };
}

export async function runScenarioBlock(
  scenario: AnyScenario,
  executor: AnyExecutor,
  seed: number,
  iterations: number,
  frameIntervalMs: number,
): Promise<ScenarioBlock> {
  for (let i = 0; i < WARMUP_REPEATS; i += 1) {
    await runScenarioRepeat(scenario, executor, seed, iterations, frameIntervalMs);
  }
  const repeats: ScenarioRepeat[] = [];
  for (let i = 0; i < RECORDED_REPEATS; i += 1) {
    repeats.push(await runScenarioRepeat(scenario, executor, seed, iterations, frameIntervalMs));
  }
  return {
    kind: BlockKind.Scenario,
    scenarioId: scenario.id,
    executorId: executor.id,
    level: executor.level,
    volume: scenario.volume,
    repeats,
  };
}
