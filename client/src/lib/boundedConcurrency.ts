export async function processWithBoundedConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
  options: { shouldContinue?: () => boolean } = {},
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const workerCount = Math.min(items.length, Math.max(1, Math.floor(concurrency)));
  let nextIndex = 0;

  const runners = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      if (options.shouldContinue && !options.shouldContinue()) {
        return;
      }

      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(runners);
}
