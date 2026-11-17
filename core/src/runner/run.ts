import { ScenarioId } from "../types";
import type { Block, Protocol, RunConfig } from "../types";
import { calibrateLoad } from "../load/calibrate";
import { probeFrameInterval } from "../measure/frame-interval";
import { executors, findExecutor } from "../executors";
import { schedulerYieldAvailable } from "../executors/scheduler";
import { findScenario } from "../scenarios";
import { mulberry32, shuffle } from "./random";
import { runBaselineBlock, runScenarioBlock } from "./block";

const SCHEMA_VERSION = 3;

export const defaultConfig: RunConfig = {
  scenarioIds: [ScenarioId.S2],
  executorIds: executors.map((executor) => executor.id),
  inputSeed: 1,
  orderSeed: 2,
};

export async function run(config: RunConfig): Promise<Protocol> {
  const startedAt = new Date().toISOString();
  const frameInterval = await probeFrameInterval();
  const calibration = calibrateLoad(frameInterval.medianMs);

  const pairs = config.scenarioIds.flatMap((scenarioId) =>
    config.executorIds.map((executorId) => ({ scenarioId, executorId })),
  );
  const order = shuffle(pairs, mulberry32(config.orderSeed));

  const blocks: Block[] = [];
  for (const scenarioId of config.scenarioIds) {
    blocks.push(
      await runBaselineBlock(
        findScenario(scenarioId),
        calibration.iterations,
        frameInterval.medianMs,
      ),
    );
  }
  for (const pair of order) {
    blocks.push(
      await runScenarioBlock(
        findScenario(pair.scenarioId),
        findExecutor(pair.executorId),
        config.inputSeed,
        calibration.iterations,
        frameInterval.medianMs,
      ),
    );
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    runId: `${startedAt.replace(/[:.]/g, "-")}-${config.orderSeed}`,
    startedAt,
    config,
    environment: {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      schedulerYieldAvailable,
    },
    frameInterval,
    calibration,
    blocks,
  };
}
