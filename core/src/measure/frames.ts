export function recordFrames(): () => number[] {
  const frameTimestamps: number[] = [];
  let active = true;
  const tick = (): void => {
    frameTimestamps.push(performance.now());
    if (active) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return () => {
    active = false;
    return frameTimestamps.slice();
  };
}

export function nextFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const tick = (): void => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
