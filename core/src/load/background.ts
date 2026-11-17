export function busyLoop(iterations: number): number {
  let accumulator = 0;
  for (let i = 0; i < iterations; i += 1) accumulator = (accumulator + i) | 0;
  return accumulator;
}

export function startLoad(iterations: number): () => number {
  let sink = 0;
  let active = true;
  const tick = (): void => {
    if (!active) return;
    sink = (sink + busyLoop(iterations)) | 0;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => {
    active = false;
    return sink;
  };
}
