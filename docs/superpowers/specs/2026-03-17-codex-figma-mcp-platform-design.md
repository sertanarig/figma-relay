# Codex Figma MCP Platform Design

## Goal

Build a new MCP-first Figma platform that replaces the current prompt bridge with a stable, typed, inspectable, and extensible tool system. The end state is a local MCP server plus a Figma plugin runtime that together provide full read/write/inspect/debug capability for Codex and other MCP-compatible agents.

## Product Outcome

The system should let an agent:

- Discover whether Figma is connected and what capabilities are available.
- Read the current design state before making changes.
- Mutate nodes, components, variables, and document structure through deterministic tool calls.
- Verify the result with screenshots, logs, and change traces.
- Recover safely from retries, reconnects, and stale state.

This platform is not a prompt relay. Prompt-based workflows may exist later as an orchestration layer, but the source of truth is typed MCP tools.

## Non-Goals

- Preserving backward compatibility with the current `bridge:send` prompt interface.
- Keeping the current plugin architecture as the primary runtime model.
- Matching `figma-console-mcp` internals exactly.
- Building every convenience workflow in the first iteration.

## Success Criteria

The platform is successful when:

1. Codex can perform stable two-way communication with Figma through MCP tools only.
2. The system covers the same practical capability categories as `figma-console-mcp`.
3. A failed or repeated request does not corrupt Figma state or leave the server in an ambiguous state.
4. An agent can inspect, mutate, and verify a design without falling back to manual plugin interaction.
5. Other MCP clients can consume the same tool surface with no Codex-specific assumptions.

## User Experience Principles

- Typed over inferred.
- Read before write.
- Deterministic over magical.
- Observable over silent.
- Retry-safe over fragile.
- Capability-driven over hardcoded assumptions.

## Architecture

The platform has three major layers:

### 1. Figma Runtime Plugin

The plugin is a long-lived execution runtime inside Figma Desktop. It is responsible for:

- Receiving structured commands from the local MCP server.
- Executing Figma API operations.
- Returning typed results, errors, traces, and metadata.
- Publishing runtime state such as file, page, selection, and capability changes.

The plugin should not contain prompt interpretation logic. It should expose a command dispatcher over a strict message protocol.

### 2. Local MCP Server

The local server is the public control plane for agents. It is responsible for:

- Advertising MCP tools and capability metadata.
- Managing client sessions and plugin sessions.
- Routing tool invocations to the active Figma runtime.
- Performing input validation, request tracking, timeout handling, and structured error mapping.
- Providing higher-level orchestration tools when appropriate.

This layer owns the external contract and must remain stable even if the plugin internals evolve.

### 3. Shared Protocol and Domain Model

A shared types package defines:

- Request envelopes
- Response envelopes
- Error types
- Tool schemas
- Node references
- Session identifiers
- Version/capability descriptors
- Trace and audit event payloads

This package is the stability backbone. Both the plugin and server use the same typed protocol.

## Core Runtime Model

### Sessions

The platform distinguishes between:

- MCP client session
- Local server process
- Figma runtime session
- Active document context

Each request must be attributable to a stable request id and an active runtime session id.

### Capabilities

The runtime reports its supported capabilities at startup and whenever the environment changes. Examples:

- variables.read
- variables.write
- components.instantiate
- screenshots.capture
- logs.stream
- comments.write

The MCP server uses these capabilities to determine tool availability and to fail clearly when a feature is unavailable.

### Request Lifecycle

Every request follows the same lifecycle:

1. Validate input schema.
2. Bind to active runtime session.
3. Resolve target nodes or resources.
4. Execute a typed command in the plugin.
5. Emit structured result plus trace.
6. Record completion status.

Lifecycle states should be machine-readable:

- queued
- sent
- running
- succeeded
- failed
- cancelled
- timed_out

## Tool Surface

The tool system should be grouped by capability family.

### A. Runtime and Health

- `figma_get_status`
- `figma_list_open_files`
- `figma_get_selection`
- `figma_get_runtime_capabilities`
- `figma_reconnect`
- `figma_ping`

### B. Read and Inspect

- `figma_get_file_context`
- `figma_get_node`
- `figma_get_nodes`
- `figma_get_children`
- `figma_get_screenshot`
- `figma_get_variables`
- `figma_get_styles`
- `figma_get_components`
- `figma_get_component_details`
- `figma_get_design_snapshot`

### C. Mutation Primitives

- `figma_create_node`
- `figma_create_child`
- `figma_clone_node`
- `figma_delete_node`
- `figma_move_node`
- `figma_resize_node`
- `figma_rename_node`
- `figma_set_text`
- `figma_set_fills`
- `figma_set_strokes`
- `figma_set_opacity`
- `figma_set_layout`
- `figma_group_nodes`

### D. Variables and Tokens

- `figma_create_variable_collection`
- `figma_add_mode`
- `figma_rename_mode`
- `figma_create_variable`
- `figma_batch_create_variables`
- `figma_update_variable`
- `figma_batch_update_variables`
- `figma_rename_variable`
- `figma_delete_variable`
- `figma_delete_variable_collection`
- `figma_get_token_values`

### E. Components

- `figma_create_component`
- `figma_create_component_set`
- `figma_add_component_property`
- `figma_edit_component_property`
- `figma_delete_component_property`
- `figma_search_components`
- `figma_instantiate_component`
- `figma_set_instance_properties`
- `figma_arrange_component_set`

### F. Validation and Debugging

- `figma_take_screenshot`
- `figma_capture_screenshot`
- `figma_get_console_logs`
- `figma_watch_console`
- `figma_get_design_changes`
- `figma_get_operation_trace`
- `figma_reload_plugin`

### G. Review and Documentation

- `figma_check_design_parity`
- `figma_generate_component_doc`
- `figma_post_comment`
- `figma_get_comments`

### H. Orchestration Helpers

These are optional higher-level tools that are built on top of primitives:

- `figma_apply_patch_plan`
- `figma_sync_tokens_from_map`
- `figma_generate_a11y_report`
- `figma_transform_screen_variant`

These should never be the only path to an operation. They exist to speed up agent workflows, not to replace primitive tools.

## Stability Strategy

Stability is a first-class requirement, not a later hardening step.

### Typed Contracts

All tool inputs and outputs must be schema-validated. No free-form parsing in the execution path.

### Idempotency

Mutation tools must support retry-safe semantics when possible. For example:

- Client-generated operation ids
- Duplicate request detection
- Safe replays for batch operations

### Stale State Protection

Operations that depend on current selection or node existence must fail with explicit stale-state errors when the document changed underneath the caller.

### Structured Errors

Errors must expose:

- category
- code
- message
- retryable boolean
- details object
- request id

Examples:

- `RUNTIME_NOT_CONNECTED`
- `CAPABILITY_UNAVAILABLE`
- `NODE_NOT_FOUND`
- `STALE_SELECTION`
- `FONT_LOAD_FAILED`
- `VALIDATION_ERROR`

### Tracing

Each operation should emit trace metadata:

- request id
- tool name
- session id
- target node ids
- start time
- end time
- duration
- result summary

### Queueing and Concurrency

Mutations should be serialized per active Figma runtime by default. Read operations may run concurrently when safe, but the server should preserve a strict ordering guarantee for writes.

## Data and Domain Boundaries

The codebase should be split into clear modules:

- `packages/protocol`
- `packages/mcp-server`
- `packages/figma-runtime`
- `packages/shared-utils`
- `packages/tool-definitions`
- `apps/dev-inspector` or equivalent debug surface if needed

The goal is to keep tool schemas, routing, and runtime execution isolated and testable.

## Verification Model

No major mutation workflow is complete without verification support.

The platform should support:

- post-mutation screenshot capture
- recent change retrieval
- operation traces
- console log inspection

This allows Codex to validate that changes were applied as intended instead of trusting success messages blindly.

## Compatibility

The platform should be compatible with:

- Codex
- Claude Desktop / Claude Code where MCP is supported
- Cursor or other MCP-aware tools
- Manual local scripting over MCP

Compatibility requires neutral tool naming, complete descriptions, and no client-specific protocol assumptions.

## Phased Delivery

### Milestone 1: MCP Foundation

Deliver the new workspace structure, protocol types, runtime handshake, health tools, and basic request lifecycle.

### Milestone 2: Read/Inspect Parity

Deliver selection, node inspection, screenshots, file context, variable listing, and component inventory tools.

### Milestone 3: Mutation Primitives

Deliver the generic edit surface for nodes, text, fills, strokes, resize, move, rename, clone, and delete.

### Milestone 4: Variables and Components Parity

Deliver advanced token and component workflows including batch operations, modes, instantiation, and instance properties.

### Milestone 5: Validation and Debugging

Deliver logs, change feed, traces, and screenshot validation loops.

### Milestone 6: Stability Hardening

Deliver idempotency, stale-state protection, reconnection resilience, queueing guarantees, and conflict detection.

### Milestone 7: Compatibility and Migration

Deliver MCP client docs, example workflows, prompt-to-tool orchestration helpers, and cleanup of the old bridge code.

## Risks

- Figma Desktop runtime constraints may limit some plugin-side observability features.
- Variable and component APIs may have edge cases that differ by file type or Figma environment.
- Screenshot and log tooling may create payload size and latency pressure.
- Overbuilding high-level tools too early could recreate the current instability under a different shape.

## Mitigations

- Start from primitives and add orchestration later.
- Enforce schema validation at the MCP boundary.
- Build request tracing before complex write flows.
- Treat screenshots and logs as first-class verification outputs, not optional extras.

## Testing Strategy

The system needs three test layers:

- Unit tests for protocol schemas, routing, and command normalization.
- Integration tests for MCP server to plugin lifecycle using mocked runtime channels.
- Runtime/manual verification scripts for live Figma execution, screenshots, and recovery behavior.

## Operational Notes

- This workspace is not currently a git repository, so spec commit steps are blocked until the project is initialized under git.
- Because subagent delegation was not explicitly requested, spec review subagent steps from the skill are not executed here.

