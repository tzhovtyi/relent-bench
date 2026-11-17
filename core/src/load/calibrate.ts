import type { Calibration } from "../types";
import { busyLoop } from "./background";

export const TARGET_FRAME_SHARE = 0.3;

const TOLERANCE = 0.1;
const ATTEMPTS = 12;
const INITIAL_ITERATIONS = 10_000;
const MIN_STEP_SCALE = 0.2;
const MAX_STEP_SCALE = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function timeBusyLoop(iterations: number): number {
  const start = performance.now();
  busyLoop(iterations);
  return performance.now() - start;
}

export function calibrateLoad(frameIntervalMs: number): Calibration {
  const targetMs = TARGET_FRAME_SHARE * frameIntervalMs;
  const withinTolerance = (measuredMs: number): boolean =>
    Math.abs(measuredMs - targetMs) <= TOLERANCE * targetMs;

  let iterations = INITIAL_ITERATIONS;
  timeBusyLoop(iterations);
  let measuredMs = timeBusyLoop(iterations);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    if (withinTolerance(measuredMs)) break;
    const scale = measuredMs > 0 ? targetMs / measuredMs : MAX_STEP_SCALE;
    iterations = Math.max(
      1,
      Math.round(iterations * clamp(scale, MIN_STEP_SCALE, MAX_STEP_SCALE)),
    );
    measuredMs = timeBusyLoop(iterations);
  }
  return { iterations, measuredFrameShare: measuredMs / frameIntervalMs };
}
