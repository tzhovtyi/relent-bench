import assert from 'node:assert/strict';
import { bracket, frameIntervals, frameMetrics, quantile } from './metrics';
import { mulberry32, shuffle } from '../runner/random';

assert.deepEqual(frameIntervals([0, 10, 25]), [10, 15]);
assert.deepEqual(frameIntervals([5]), []);

assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
assert.equal(quantile([3, 1, 2], 0.5), 2);
assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
assert.ok(Number.isNaN(quantile([], 0.5)));

assert.deepEqual(bracket([0, 8, 16, 100, 108], 20, 95), [16, 100]);
assert.deepEqual(bracket([0, 8, 16], 4, 12), [0, 8, 16]);
assert.deepEqual(bracket([50, 60], 10, 20), [50]);
assert.deepEqual(bracket([10, 20], 30, 40), [20]);
assert.deepEqual(bracket([], 1, 2), []);
assert.equal(frameMetrics(bracket([0, 8, 100, 108], 10, 95), 8).maxBlockingMs, 84);

const idle = frameMetrics([0, 10, 20, 30], 10);
assert.deepEqual(idle, {
  maxBlockingMs: 0,
  totalBlockingMs: 0,
  framesRendered: 4,
  framesSkipped: 0,
  framesExpected: 4,
});

const blocked = frameMetrics([0, 10, 60, 70], 10);
assert.equal(blocked.maxBlockingMs, 40);
assert.equal(blocked.totalBlockingMs, 40);
assert.equal(blocked.framesSkipped, 4);
assert.equal(blocked.framesRendered, 4);
assert.equal(blocked.framesExpected, 8);

const jitter = frameMetrics([0, 9, 19, 30], 10);
assert.equal(jitter.framesSkipped, 0);
assert.ok(Math.abs(jitter.totalBlockingMs - 1) < 1e-9);

const short = frameMetrics([0, 4, 8], 10);
assert.equal(short.framesSkipped, 0);
assert.equal(short.totalBlockingMs, 0);

const split = frameMetrics([0, 30, 60], 10);
const single = frameMetrics([0, 10, 60], 10);
assert.equal(split.totalBlockingMs, 40);
assert.equal(single.totalBlockingMs, 40);
assert.notEqual(split.maxBlockingMs, single.maxBlockingMs);

for (const metrics of [idle, blocked, jitter, short, split, single]) {
  assert.equal(metrics.framesExpected, metrics.framesRendered + metrics.framesSkipped);
}

const empty = frameMetrics([], 10);
assert.equal(empty.framesRendered, 0);
assert.equal(empty.framesExpected, 0);
assert.equal(frameMetrics([7], 10).totalBlockingMs, 0);

const first = Array.from({ length: 5 }, mulberry32(42));
const second = Array.from({ length: 5 }, mulberry32(42));
assert.deepEqual(first, second);
assert.notDeepEqual(first, Array.from({ length: 5 }, mulberry32(43)));
assert.ok(first.every((value) => value >= 0 && value < 1));

const items = [1, 2, 3, 4, 5, 6, 7, 8];
assert.deepEqual(shuffle(items, mulberry32(7)), shuffle(items, mulberry32(7)));
assert.deepEqual([...shuffle(items, mulberry32(7))].sort((a, b) => a - b), items);

console.log('measure: ok');
