import { z } from "zod";

export const capabilitySchema = z.enum([
  "runtime.status",
  "runtime.reconnect",
  "selection.read",
  "node.read",
  "node.write",
  "styles.read",
  "styles.write",
  "variables.read",
  "variables.write",
  "components.read",
  "components.write",
  "screenshots.capture",
  "logs.read",
  "comments.read",
  "comments.write"
]);

export const runtimeCapabilitiesSchema = z.array(capabilitySchema);
