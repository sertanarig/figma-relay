# Codex Figma MCP Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing prompt bridge with a stable MCP-first Figma platform that supports full inspect, mutate, validate, and debug workflows for Codex and other MCP clients.

**Architecture:** A local MCP server exposes typed tool schemas and routes validated requests to a long-lived Figma plugin runtime. Shared protocol types define requests, responses, capabilities, and errors. Mutation primitives ship first; orchestration helpers are added only after the primitive surface is stable.

**Tech Stack:** TypeScript, Node.js, MCP server SDK, Figma plugin runtime, shared schema validation library, screenshot/log verification utilities

---

## Chunk 1: Workspace and Protocol Foundation

### Task 1: Establish the new workspace structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/src/index.ts`
- Create: `packages/figma-runtime/package.json`
- Create: `packages/figma-runtime/src/index.ts`
- Create: `packages/tool-definitions/package.json`
- Create: `packages/tool-definitions/src/index.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing workspace smoke test**

Create `packages/mcp-server/src/index.test.ts` with a smoke assertion that imports `@codex-figma/protocol` and the tool registry.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- packages/mcp-server/src/index.test.ts`
Expected: FAIL because the new workspace packages and test runner are not configured yet.

- [ ] **Step 3: Add workspace manifests and TypeScript baseline**

Create a workspace-based root `package.json` with package scripts for build, test, lint, and dev.

- [ ] **Step 4: Add empty package entrypoints**

Create minimal `index.ts` files in each package that export placeholders for later implementation.

- [ ] **Step 5: Run the smoke test again**

Run: `npm test -- packages/mcp-server/src/index.test.ts`
Expected: PASS or reach the next missing-symbol failure that confirms the workspace is wired.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.base.json packages README.md
git commit -m "chore: scaffold MCP-first figma workspace"
```

### Task 2: Define shared protocol schemas

**Files:**
- Create: `packages/protocol/src/schema/request.ts`
- Create: `packages/protocol/src/schema/response.ts`
- Create: `packages/protocol/src/schema/error.ts`
- Create: `packages/protocol/src/schema/capability.ts`
- Create: `packages/protocol/src/schema/session.ts`
- Create: `packages/protocol/src/schema/trace.ts`
- Modify: `packages/protocol/src/index.ts`
- Test: `packages/protocol/src/schema/protocol.test.ts`

- [ ] **Step 1: Write failing protocol schema tests**

Test request envelope validation, success response validation, and known error codes.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- packages/protocol/src/schema/protocol.test.ts`
Expected: FAIL because schemas do not exist.

- [ ] **Step 3: Implement schema modules**

Define strict request/response/error/capability/session/trace shapes and export them from the protocol package.

- [ ] **Step 4: Run protocol tests**

Run: `npm test -- packages/protocol/src/schema/protocol.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/protocol
git commit -m "feat: add shared MCP protocol schemas"
```

## Chunk 2: Runtime Handshake and Health Surface

### Task 3: Build the runtime session manager

**Files:**
- Create: `packages/mcp-server/src/runtime/session-manager.ts`
- Create: `packages/mcp-server/src/runtime/in-memory-runtime-store.ts`
- Create: `packages/mcp-server/src/runtime/session-manager.test.ts`
- Modify: `packages/mcp-server/src/index.ts`

- [ ] **Step 1: Write failing session manager tests**

Test runtime connect, disconnect, capability update, and active-session lookup.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/runtime/session-manager.test.ts`
Expected: FAIL because the session manager is missing.

- [ ] **Step 3: Implement runtime session storage**

Support one or more runtime sessions with active-session resolution and lifecycle timestamps.

- [ ] **Step 4: Re-run the test**

Run: `npm test -- packages/mcp-server/src/runtime/session-manager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/runtime
git commit -m "feat: add runtime session management"
```

### Task 4: Replace the old bridge lifecycle with a typed handshake

**Files:**
- Create: `packages/figma-runtime/src/bridge/handshake.ts`
- Create: `packages/figma-runtime/src/bridge/channel.ts`
- Modify: `src/code.js`
- Modify: `src/ui.html`
- Test: `packages/figma-runtime/src/bridge/handshake.test.ts`

- [ ] **Step 1: Write failing handshake tests**

Cover runtime hello payload, capability advertisement, and reconnect behavior.

- [ ] **Step 2: Run the handshake test**

Run: `npm test -- packages/figma-runtime/src/bridge/handshake.test.ts`
Expected: FAIL because the new bridge modules are missing.

- [ ] **Step 3: Implement a typed runtime handshake**

The plugin must register with a session id, file context, runtime version, and capabilities instead of waiting for free-form prompts.

- [ ] **Step 4: Adapt plugin UI transport**

Update `src/ui.html` and `src/code.js` so they exchange structured runtime messages rather than prompt text.

- [ ] **Step 5: Re-run handshake tests**

Run: `npm test -- packages/figma-runtime/src/bridge/handshake.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/figma-runtime src/code.js src/ui.html
git commit -m "feat: add typed runtime handshake"
```

### Task 5: Ship health and status MCP tools

**Files:**
- Create: `packages/tool-definitions/src/runtime-tools.ts`
- Create: `packages/mcp-server/src/tools/runtime/get-status.ts`
- Create: `packages/mcp-server/src/tools/runtime/list-open-files.ts`
- Create: `packages/mcp-server/src/tools/runtime/reconnect.ts`
- Test: `packages/mcp-server/src/tools/runtime/runtime-tools.test.ts`

- [ ] **Step 1: Write failing tool tests**

Cover `figma_get_status`, `figma_list_open_files`, and `figma_reconnect`.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/runtime/runtime-tools.test.ts`
Expected: FAIL because the tool handlers are missing.

- [ ] **Step 3: Implement runtime tool definitions and handlers**

Wire each tool to the session manager and runtime channel.

- [ ] **Step 4: Re-run runtime tool tests**

Run: `npm test -- packages/mcp-server/src/tools/runtime/runtime-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/tool-definitions packages/mcp-server/src/tools/runtime
git commit -m "feat: add runtime health MCP tools"
```

## Chunk 3: Read and Inspect Surface

### Task 6: Implement selection and node inspection commands

**Files:**
- Create: `packages/figma-runtime/src/commands/read/get-selection.ts`
- Create: `packages/figma-runtime/src/commands/read/get-node.ts`
- Create: `packages/figma-runtime/src/commands/read/get-children.ts`
- Create: `packages/mcp-server/src/tools/read/get-selection.ts`
- Create: `packages/mcp-server/src/tools/read/get-node.ts`
- Create: `packages/mcp-server/src/tools/read/get-children.ts`
- Test: `packages/mcp-server/src/tools/read/read-tools.test.ts`

- [ ] **Step 1: Write failing read tool tests**

Cover empty selection, selected node metadata, and child traversal.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/read/read-tools.test.ts`
Expected: FAIL because read commands are missing.

- [ ] **Step 3: Implement plugin-side read commands**

Return typed node snapshots and selection references only.

- [ ] **Step 4: Implement server-side read tools**

Map MCP inputs to runtime requests and normalize outputs.

- [ ] **Step 5: Re-run the read tool tests**

Run: `npm test -- packages/mcp-server/src/tools/read/read-tools.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/figma-runtime/src/commands/read packages/mcp-server/src/tools/read
git commit -m "feat: add selection and node inspection tools"
```

### Task 7: Implement screenshot and file-context reads

**Files:**
- Create: `packages/figma-runtime/src/commands/read/get-screenshot.ts`
- Create: `packages/figma-runtime/src/commands/read/get-file-context.ts`
- Create: `packages/mcp-server/src/tools/read/get-screenshot.ts`
- Create: `packages/mcp-server/src/tools/read/get-file-context.ts`
- Test: `packages/mcp-server/src/tools/read/screenshot-tools.test.ts`

- [ ] **Step 1: Write failing screenshot tests**

Test current page screenshot capture and file/page metadata retrieval.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/read/screenshot-tools.test.ts`
Expected: FAIL because screenshot commands are missing.

- [ ] **Step 3: Implement screenshot and file-context commands**

Return asset references or encoded payloads in a stable response envelope.

- [ ] **Step 4: Re-run screenshot tests**

Run: `npm test -- packages/mcp-server/src/tools/read/screenshot-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/read packages/mcp-server/src/tools/read
git commit -m "feat: add screenshot and file context tools"
```

### Task 8: Implement variable and component inventory reads

**Files:**
- Create: `packages/figma-runtime/src/commands/read/get-variables.ts`
- Create: `packages/figma-runtime/src/commands/read/get-components.ts`
- Create: `packages/mcp-server/src/tools/read/get-variables.ts`
- Create: `packages/mcp-server/src/tools/read/get-components.ts`
- Test: `packages/mcp-server/src/tools/read/inventory-tools.test.ts`

- [ ] **Step 1: Write failing inventory tests**

Cover variable collections, mode summaries, and component listing.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/read/inventory-tools.test.ts`
Expected: FAIL because inventory handlers are missing.

- [ ] **Step 3: Implement inventory commands**

Return compact inventory payloads suitable for agent planning.

- [ ] **Step 4: Re-run inventory tests**

Run: `npm test -- packages/mcp-server/src/tools/read/inventory-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/read packages/mcp-server/src/tools/read
git commit -m "feat: add variable and component inventory tools"
```

## Chunk 4: Mutation Primitives

### Task 9: Implement generic node creation and deletion

**Files:**
- Create: `packages/figma-runtime/src/commands/write/create-node.ts`
- Create: `packages/figma-runtime/src/commands/write/delete-node.ts`
- Create: `packages/mcp-server/src/tools/write/create-node.ts`
- Create: `packages/mcp-server/src/tools/write/delete-node.ts`
- Test: `packages/mcp-server/src/tools/write/node-lifecycle.test.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Cover rectangle creation, text creation, and deletion by node id.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/write/node-lifecycle.test.ts`
Expected: FAIL because write handlers are missing.

- [ ] **Step 3: Implement create/delete primitives**

Support basic node types with typed property payloads.

- [ ] **Step 4: Re-run lifecycle tests**

Run: `npm test -- packages/mcp-server/src/tools/write/node-lifecycle.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/write packages/mcp-server/src/tools/write
git commit -m "feat: add node lifecycle primitives"
```

### Task 10: Implement mutation primitives for move, resize, rename, text, fills, and strokes

**Files:**
- Create: `packages/figma-runtime/src/commands/write/move-node.ts`
- Create: `packages/figma-runtime/src/commands/write/resize-node.ts`
- Create: `packages/figma-runtime/src/commands/write/rename-node.ts`
- Create: `packages/figma-runtime/src/commands/write/set-text.ts`
- Create: `packages/figma-runtime/src/commands/write/set-fills.ts`
- Create: `packages/figma-runtime/src/commands/write/set-strokes.ts`
- Create: `packages/mcp-server/src/tools/write/mutation-tools.ts`
- Test: `packages/mcp-server/src/tools/write/mutation-tools.test.ts`

- [ ] **Step 1: Write failing mutation tests**

Test deterministic edits against a mocked runtime.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/write/mutation-tools.test.ts`
Expected: FAIL because edit primitives are missing.

- [ ] **Step 3: Implement edit primitives**

Support all input validation and explicit node-not-found errors.

- [ ] **Step 4: Re-run mutation tests**

Run: `npm test -- packages/mcp-server/src/tools/write/mutation-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/write packages/mcp-server/src/tools/write
git commit -m "feat: add core mutation primitives"
```

### Task 11: Implement clone and hierarchy operations

**Files:**
- Create: `packages/figma-runtime/src/commands/write/clone-node.ts`
- Create: `packages/figma-runtime/src/commands/write/create-child.ts`
- Create: `packages/mcp-server/src/tools/write/clone-node.ts`
- Create: `packages/mcp-server/src/tools/write/create-child.ts`
- Test: `packages/mcp-server/src/tools/write/hierarchy-tools.test.ts`

- [ ] **Step 1: Write failing hierarchy tests**

Cover clone offsets and child insertion into frames/components where allowed.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/write/hierarchy-tools.test.ts`
Expected: FAIL because hierarchy commands are missing.

- [ ] **Step 3: Implement hierarchy operations**

Normalize parent validation and child creation rules.

- [ ] **Step 4: Re-run hierarchy tests**

Run: `npm test -- packages/mcp-server/src/tools/write/hierarchy-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/write packages/mcp-server/src/tools/write
git commit -m "feat: add clone and hierarchy tools"
```

## Chunk 5: Variables and Components Parity

### Task 12: Implement variable collection and mode management

**Files:**
- Create: `packages/figma-runtime/src/commands/variables/create-collection.ts`
- Create: `packages/figma-runtime/src/commands/variables/add-mode.ts`
- Create: `packages/figma-runtime/src/commands/variables/rename-mode.ts`
- Create: `packages/mcp-server/src/tools/variables/collection-tools.ts`
- Test: `packages/mcp-server/src/tools/variables/collection-tools.test.ts`

- [ ] **Step 1: Write failing collection tests**

Test collection creation and mode additions.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/variables/collection-tools.test.ts`
Expected: FAIL because collection handlers are missing.

- [ ] **Step 3: Implement collection and mode commands**

Return stable collection identifiers and mode identifiers.

- [ ] **Step 4: Re-run collection tests**

Run: `npm test -- packages/mcp-server/src/tools/variables/collection-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/variables packages/mcp-server/src/tools/variables
git commit -m "feat: add variable collection and mode tools"
```

### Task 13: Implement variable CRUD and batch updates

**Files:**
- Create: `packages/figma-runtime/src/commands/variables/create-variable.ts`
- Create: `packages/figma-runtime/src/commands/variables/update-variable.ts`
- Create: `packages/figma-runtime/src/commands/variables/batch-update-variables.ts`
- Create: `packages/figma-runtime/src/commands/variables/delete-variable.ts`
- Create: `packages/mcp-server/src/tools/variables/variable-tools.ts`
- Test: `packages/mcp-server/src/tools/variables/variable-tools.test.ts`

- [ ] **Step 1: Write failing variable tests**

Cover color and float variables, batch writes, and delete flow.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/variables/variable-tools.test.ts`
Expected: FAIL because variable handlers are missing.

- [ ] **Step 3: Implement variable CRUD and batch semantics**

Include optional client operation ids so retries are traceable.

- [ ] **Step 4: Re-run variable tests**

Run: `npm test -- packages/mcp-server/src/tools/variables/variable-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/variables packages/mcp-server/src/tools/variables
git commit -m "feat: add variable CRUD and batch tools"
```

### Task 14: Implement component search, create, and instantiate flows

**Files:**
- Create: `packages/figma-runtime/src/commands/components/create-component.ts`
- Create: `packages/figma-runtime/src/commands/components/search-components.ts`
- Create: `packages/figma-runtime/src/commands/components/instantiate-component.ts`
- Create: `packages/figma-runtime/src/commands/components/set-instance-properties.ts`
- Create: `packages/mcp-server/src/tools/components/component-tools.ts`
- Test: `packages/mcp-server/src/tools/components/component-tools.test.ts`

- [ ] **Step 1: Write failing component tests**

Cover component search, component creation, instantiation, and property updates.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/components/component-tools.test.ts`
Expected: FAIL because component handlers are missing.

- [ ] **Step 3: Implement component commands**

Ensure instance property setting is explicit and never relies on direct text mutation.

- [ ] **Step 4: Re-run component tests**

Run: `npm test -- packages/mcp-server/src/tools/components/component-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/commands/components packages/mcp-server/src/tools/components
git commit -m "feat: add component lifecycle tools"
```

## Chunk 6: Validation and Debugging

### Task 15: Implement operation tracing and recent-change retrieval

**Files:**
- Create: `packages/mcp-server/src/observability/trace-store.ts`
- Create: `packages/figma-runtime/src/observability/change-feed.ts`
- Create: `packages/mcp-server/src/tools/debug/get-operation-trace.ts`
- Create: `packages/mcp-server/src/tools/debug/get-design-changes.ts`
- Test: `packages/mcp-server/src/tools/debug/debug-tools.test.ts`

- [ ] **Step 1: Write failing debug tests**

Cover trace lookup by request id and recent change feed retrieval.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/debug/debug-tools.test.ts`
Expected: FAIL because observability modules are missing.

- [ ] **Step 3: Implement trace store and change feed**

Capture structured operation metadata and document change events.

- [ ] **Step 4: Re-run debug tests**

Run: `npm test -- packages/mcp-server/src/tools/debug/debug-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/observability packages/figma-runtime/src/observability packages/mcp-server/src/tools/debug
git commit -m "feat: add operation traces and design change tools"
```

### Task 16: Implement plugin log retrieval and screenshot verification support

**Files:**
- Create: `packages/figma-runtime/src/observability/console-buffer.ts`
- Create: `packages/mcp-server/src/tools/debug/get-console-logs.ts`
- Create: `packages/mcp-server/src/tools/debug/take-screenshot.ts`
- Test: `packages/mcp-server/src/tools/debug/verification-tools.test.ts`

- [ ] **Step 1: Write failing verification tests**

Cover recent console log retrieval and post-operation screenshot capture.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/tools/debug/verification-tools.test.ts`
Expected: FAIL because verification tools are missing.

- [ ] **Step 3: Implement console buffering and screenshot verification hooks**

Keep payloads bounded and allow filtering by level or recent operation.

- [ ] **Step 4: Re-run verification tests**

Run: `npm test -- packages/mcp-server/src/tools/debug/verification-tools.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/figma-runtime/src/observability packages/mcp-server/src/tools/debug
git commit -m "feat: add logs and screenshot verification tools"
```

## Chunk 7: Stability Hardening

### Task 17: Add idempotency and stale-state protection

**Files:**
- Create: `packages/mcp-server/src/runtime/idempotency-store.ts`
- Create: `packages/figma-runtime/src/guards/stale-state.ts`
- Modify: `packages/mcp-server/src/tools/write/*.ts`
- Modify: `packages/mcp-server/src/tools/variables/*.ts`
- Test: `packages/mcp-server/src/runtime/idempotency.test.ts`

- [ ] **Step 1: Write failing stability tests**

Cover duplicate operation ids, stale selection, and node-changed conflicts.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/runtime/idempotency.test.ts`
Expected: FAIL because stability guards are missing.

- [ ] **Step 3: Implement idempotency and stale-state handling**

Persist recent operation ids and detect mismatched runtime context.

- [ ] **Step 4: Re-run stability tests**

Run: `npm test -- packages/mcp-server/src/runtime/idempotency.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/runtime packages/figma-runtime/src/guards packages/mcp-server/src/tools
git commit -m "feat: harden runtime idempotency and stale-state handling"
```

### Task 18: Add serialized write queue and timeout handling

**Files:**
- Create: `packages/mcp-server/src/runtime/write-queue.ts`
- Modify: `packages/mcp-server/src/index.ts`
- Modify: `packages/mcp-server/src/runtime/session-manager.ts`
- Test: `packages/mcp-server/src/runtime/write-queue.test.ts`

- [ ] **Step 1: Write failing queue tests**

Cover ordered writes, timeout expiry, and cancellation cleanup.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/runtime/write-queue.test.ts`
Expected: FAIL because the write queue is missing.

- [ ] **Step 3: Implement serialized write queue**

Ensure mutation requests run in a deterministic per-runtime order.

- [ ] **Step 4: Re-run queue tests**

Run: `npm test -- packages/mcp-server/src/runtime/write-queue.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/runtime packages/mcp-server/src/index.ts
git commit -m "feat: add serialized runtime write queue"
```

## Chunk 8: Compatibility and Migration

### Task 19: Register all MCP tools and document the surface

**Files:**
- Modify: `packages/tool-definitions/src/index.ts`
- Create: `docs/mcp-tools.md`
- Modify: `README.md`
- Test: `packages/tool-definitions/src/index.test.ts`

- [ ] **Step 1: Write failing tool registry tests**

Assert that all required runtime, read, write, variables, components, and debug tools are exported.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/tool-definitions/src/index.test.ts`
Expected: FAIL because the full registry is incomplete.

- [ ] **Step 3: Implement the final tool registry**

Include clear descriptions and argument schemas for every tool.

- [ ] **Step 4: Re-run registry tests**

Run: `npm test -- packages/tool-definitions/src/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/tool-definitions docs/mcp-tools.md README.md
git commit -m "docs: publish MCP tool surface"
```

### Task 20: Remove legacy prompt-bridge assumptions

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Delete or replace: `bridge/server.mjs`
- Delete or replace: `bridge/send-prompt.mjs`
- Test: `packages/mcp-server/src/migration/legacy-compat.test.ts`

- [ ] **Step 1: Write failing migration tests**

Assert that the new startup path uses the MCP server and typed runtime handshake instead of the old prompt bridge.

- [ ] **Step 2: Run the test**

Run: `npm test -- packages/mcp-server/src/migration/legacy-compat.test.ts`
Expected: FAIL because legacy paths still exist.

- [ ] **Step 3: Replace legacy bridge entrypoints**

Either remove the old bridge or keep only a thin compatibility shim that delegates into the MCP server.

- [ ] **Step 4: Re-run migration tests**

Run: `npm test -- packages/mcp-server/src/migration/legacy-compat.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md package.json bridge packages
git commit -m "refactor: retire legacy prompt bridge"
```

## Execution Notes

- This repository is not currently a git repository, so commit steps are blocked until git is initialized.
- Because subagent delegation was not explicitly requested, the plan review loop from the skill is not executed here.
- The recommended execution order is milestone-by-milestone with live verification after each chunk.

## Immediate Next Move

Start with Chunk 1, Task 1 and Task 2. Do not build new high-level Figma helpers before the protocol, session model, and health tools exist.
