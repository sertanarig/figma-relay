import { z } from "zod";

export const errorCodeSchema = z.enum([
  "RUNTIME_NOT_CONNECTED",
  "CAPABILITY_UNAVAILABLE",
  "NODE_NOT_FOUND",
  "STALE_SELECTION",
  "FONT_LOAD_FAILED",
  "VALIDATION_ERROR",
  "TIMEOUT",
  "UNKNOWN"
]);

export const errorEnvelopeSchema = z.object({
  requestId: z.string().min(1),
  sessionId: z.string().min(1),
  code: errorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
  details: z.record(z.string(), z.unknown()).default({})
});
