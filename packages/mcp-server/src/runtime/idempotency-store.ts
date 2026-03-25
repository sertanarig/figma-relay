export function createIdempotencyStore() {
  const records = new Map<string, unknown>();

  return {
    record(operationId: string, result: unknown) {
      if (records.has(operationId)) {
        return {
          accepted: false,
          replay: records.get(operationId) ?? null
        };
      }

      records.set(operationId, result);
      return {
        accepted: true,
        replay: null
      };
    },
    get(operationId: string) {
      return records.get(operationId) ?? null;
    }
  };
}
