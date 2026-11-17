import type { FrameIntervalProbe } from "../types";
import { frameIntervals, quantile } from "./metrics";

const FRAME_SAMPLES = 60;

export async function probeFrameInterval(
  samples = FRAME_SAMPLES,
): Promise<FrameIntervalProbe> {
  const frameTimestamps: number[] = [];
  await new Promise<void>((resolve) => {
    const tick = (): void => {
      frameTimestamps.push(performance.now());
      if (frameTimestamps.length > samples) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const intervals = frameIntervals(frameTimestamps);
  return {
    medianMs: quantile(intervals, 0.5),
    interquartileRangeMs: quantile(intervals, 0.75) - quantile(intervals, 0.25),
    samples: intervals.length,
  };
}
