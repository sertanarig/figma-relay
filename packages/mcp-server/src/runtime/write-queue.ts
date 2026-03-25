type QueueOptions = {
  timeoutMs?: number;
};

export function createWriteQueue(options: QueueOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 1000;
  const tails = new Map<string, Promise<unknown>>();

  return {
    enqueue<T>(runtimeSessionId: string, work: () => Promise<T> | T): Promise<T> {
      const previous = tails.get(runtimeSessionId) ?? Promise.resolve();

      const run = previous.catch(() => undefined).then(() => {
        return new Promise<T>((resolve, reject) => {
          let settled = false;
          const timeout = setTimeout(() => {
            settled = true;
            reject(new Error("WRITE_TIMEOUT"));
          }, timeoutMs);

          Promise.resolve()
            .then(work)
            .then((result) => {
              if (settled) {
                return;
              }
              settled = true;
              clearTimeout(timeout);
              resolve(result);
            })
            .catch((error) => {
              if (settled) {
                return;
              }
              settled = true;
              clearTimeout(timeout);
              reject(error);
            });
        });
      });

      const settledTail = run
        .catch(() => undefined)
        .finally(() => {
          if (tails.get(runtimeSessionId) === settledTail) {
            tails.delete(runtimeSessionId);
          }
        });

      tails.set(runtimeSessionId, settledTail);

      return run;
    }
  };
}
