import { z } from "zod";
import { sessionIdSchema } from "./session.js";

export const responseStatusSchema = z.enum([
  "queued",
  "sent",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "timed_out"
]);

export const successResponseEnvelopeSchema = z.object({
  requestId: z.string().min(1),
  sessionId: sessionIdSchema,
  status: responseStatusSchema,
  data: z.record(z.string(), z.unknown()).default({})
});
