import { runtimeTools } from "./runtime-tools.js";
import { readTools } from "./read-tools.js";
import { writeTools } from "./write-tools.js";
import { variablesTools } from "./variables-tools.js";
import { componentsTools } from "./components-tools.js";
import { debugTools } from "./debug-tools.js";
import { commentsTools } from "./comments-tools.js";
import { auditTools } from "./audit-tools.js";
import { parityTools } from "./parity-tools.js";
import { docsTools } from "./docs-tools.js";
import { designSystemTools } from "./design-system-tools.js";
import { dashboardTools } from "./dashboard-tools.js";

export const toolRegistry = [
  ...runtimeTools,
  ...readTools,
  ...writeTools,
  ...variablesTools,
  ...componentsTools,
  ...commentsTools,
  ...designSystemTools,
  ...dashboardTools,
  ...auditTools,
  ...parityTools,
  ...docsTools,
  ...debugTools
];
