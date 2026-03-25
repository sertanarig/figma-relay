import { z } from "zod";
import { sessionIdSchema } from "./session.js";

export const requestEnvelopeSchema = z.object({
  requestId: z.string().min(1),
  sessionId: sessionIdSchema,
  command: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({})
});
