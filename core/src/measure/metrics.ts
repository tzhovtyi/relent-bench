import type { FrameMetrics } from '../types';

export function quantile(values: number[], fraction: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

export function frameIntervals(frameTimestamps: number[]): number[] {
  const intervals: number[] = [];
  for (let i = 1; i < frameTimestamps.length; i += 1) {
    intervals.push(frameTimestamps[i]! - frameTimestamps[i - 1]!);
  }
  return intervals;
}

export function bracket(frameTimestamps: number[], from: number, to: number): number[] {
  const lastBefore = frameTimestamps.findLastIndex((timestamp) => timestamp <= from);
  const firstAfter = frameTimestamps.findIndex((timestamp) => timestamp >= to);
  const start = lastBefore === -1 ? 0 : lastBefore;
  const end = firstAfter === -1 ? frameTimestamps.length - 1 : firstAfter;
  return frameTimestamps.slice(start, end + 1);
}

export function frameMetrics(frameTimestamps: number[], frameIntervalMs: number): FrameMetrics {
  let maxBlockingMs = 0;
  let totalBlockingMs = 0;
  let framesSkipped = 0;
  for (const interval of frameIntervals(frameTimestamps)) {
    const blocking = Math.max(0, interval - frameIntervalMs);
    if (blocking > maxBlockingMs) maxBlockingMs = blocking;
    totalBlockingMs += blocking;
    framesSkipped += Math.max(0, Math.round(interval / frameIntervalMs) - 1);
  }
  const framesRendered = frameTimestamps.length;
  return {
    maxBlockingMs,
    totalBlockingMs,
    framesRendered,
    framesSkipped,
    framesExpected: framesRendered + framesSkipped,
  };
}
