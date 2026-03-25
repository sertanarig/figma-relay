import { z } from "zod";

export const sessionIdSchema = z.string().min(1);
