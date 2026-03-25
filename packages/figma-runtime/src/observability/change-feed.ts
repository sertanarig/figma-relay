export type RuntimeDebugGateway = {
  getDesignChanges?(input: {
    since?: number;
    count?: number;
  }): {
    runtimeSessionId: string;
    events: Array<{
      id: string;
      nodeId: string;
      type: string;
      timestamp: number;
    }>;
  } | null;
  getConsoleLogs?(input: {
    level?: string;
    count?: number;
  }): {
    runtimeSessionId: string;
    logs: Array<{
      id: string;
      level: string;
      message: string;
      timestamp: number;
    }>;
  } | null;
  captureVerificationScreenshot?(input: {
    format: string;
    scale: number;
  }): {
    runtimeSessionId: string;
    format: string;
    scale: number;
    imageRef: string;
  } | null;
};

export function getDesignChangesSnapshot(
  gateway: RuntimeDebugGateway,
  input: { since?: number; count?: number }
) {
  return gateway.getDesignChanges ? gateway.getDesignChanges(input) : null;
}
