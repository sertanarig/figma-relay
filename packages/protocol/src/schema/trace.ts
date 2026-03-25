import { z } from "zod";
import { responseStatusSchema } from "./response.js";
import { sessionIdSchema } from "./session.js";

export const traceEnvelopeSchema = z.object({
  requestId: z.string().min(1),
  sessionId: sessionIdSchema,
  toolName: z.string().min(1),
  status: responseStatusSchema,
  targetNodeIds: z.array(z.string()).default([]),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1).optional(),
  durationMs: z.number().nonnegative().optional()
});
