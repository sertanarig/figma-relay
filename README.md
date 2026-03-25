# Figma Relay

Figma Relay is an agent-agnostic local bridge between Figma/FigJam and any MCP-compatible client.

If your client speaks MCP, that is the important part. Figma Relay is built to keep the bridge stable while different tools take turns using the same live runtime.

Under the hood, the technical package/server identity stays `figma-runtime-mcp`. The product name users see is **Figma Relay**.

This project started as a practical, slightly sleep-deprived, definitely vibe-coded evolution inspired by the original Figma Console direction. Then it grew up, got tests, smoke scripts, release gates, and a much healthier respect for runtime state.

## What it does

- Bridges a live Figma or FigJam runtime to local MCP clients
- Exposes a broad read/write tool surface for design operations
- Supports multi-agent handoff on the same local bridge
- Adds governance, reporting, release readiness, parity, and troubleshooting layers on top
- Works locally first, with no cloud relay required

## Current scope

Figma Relay currently covers:

- Figma design files
- FigJam boards
- Design system reads/writes
- Variables, styles, components, comments, screenshots, verification, and reporting
- Dashboard, audit, parity, release, and stress tooling

Slides are intentionally out of scope for now.

## Why it exists

Most agent-to-Figma experiments stop at “it can technically write a node.”

That is cute for about eight minutes.

Figma Relay is built for the next question:

> Can an agent work in a real design file, safely, repeatedly, and without turning the whole thing into a haunted house?

That means:

- typed tools
- runtime capability checks
- smoke tests
- release gates
- cache-aware reads
- calmer handoff between agents
- fewer “why did this suddenly disconnect?” moments

## Architecture

- `manifest.json`: Figma plugin manifest
- `src/code.js`: plugin entry
- `src/plugin/`: runtime logic bundled into the plugin
- `dist/code.js`: generated plugin bundle
- `dist/ui.html`: generated plugin UI
- `bridge/server.mjs`: local HTTP bridge with SSE + command routing
- `packages/mcp-server/`: MCP stdio server
- `packages/figma-runtime/`: runtime command/dispatcher logic
- `packages/tool-definitions/`: public tool registry
- `docs/`: release, tooling, and roadmap docs

## Quick start

1. Import the plugin in Figma Desktop:
   `Plugins -> Development -> Import plugin from manifest...`
2. Select [manifest.json](/Users/arigs/Projects/Figma-Relay/manifest.json)
3. Build the plugin:

```bash
npm run build:plugin
```

4. Start the local bridge:

```bash
npm run bridge:up
```

5. Open `Figma Relay` inside Figma or FigJam

6. Verify the active runtime:

```bash
npm run runtime:handoff
```

7. Run the basic live smoke:

```bash
npm run smoke:e2e
```

If the active runtime is FigJam, also run:

```bash
npm run smoke:figjam
```

## Local secrets

For server-side Figma REST tools such as comments, create a local env file:

```bash
cp .env.local.example .env.local
```

Then add the values you need:

```bash
FIGMA_ACCESS_TOKEN=your_token_here
FIGMA_FILE_KEY=your_file_key_if_needed
```

`.env.local` is loaded automatically and is ignored by git.

## Daily commands

Check runtime handoff:

```bash
npm run runtime:handoff
```

Check bridge health:

```bash
npm run bridge:doctor
```

Get a quick operator summary:

```bash
npm run troubleshoot
```

Release readiness summary:

```bash
npm run release:summary
```

Full release report:

```bash
node scripts/release-report.mjs
```

## Smoke and stress commands

Read-heavy stress:

```bash
npm run smoke:stress -- --iterations=20
```

Write-heavy stress:

```bash
npm run smoke:write-stress -- --iterations=5
```

Mixed stress:

```bash
npm run smoke:mixed-stress -- --iterations=2
```

Large-file smoke:

```bash
npm run smoke:large-file
```

Long-run loop:

```bash
npm run smoke:long-run -- --loops=1
```

Comments smoke:

```bash
npm run smoke:comments
```

Component property smoke:

```bash
npm run smoke:component-properties
```

FigJam smoke:

```bash
npm run smoke:figjam
```

## Multi-agent handoff

Figma Relay is designed so one local runtime can be reused by different agents in sequence.

That means:

- keep the plugin open
- keep the local bridge running
- point both agents at the same local MCP server

Example MCP entry:

```json
{
  "mcpServers": {
    "figma-relay": {
      "command": "bash",
      "args": [
        "-lc",
        "cd /Users/arigs/Projects/Figma-Relay && npm run mcp:stdio"
      ]
    }
  }
}
```

Safe usage model:

- one agent writes
- another agent can read/analyze
- or agents take turns writing

Unsafe usage model:

- two agents trying to write at the same time

That path leads to sadness.

## Release docs

- [Release checklist](/Users/arigs/Projects/Figma-Relay/docs/release-checklist.md)
- [Release notes v0.1.0](/Users/arigs/Projects/Figma-Relay/docs/release-notes-v0.1.0.md)
- [MCP tool surface](/Users/arigs/Projects/Figma-Relay/docs/mcp-tools.md)
- [Parity backlog](/Users/arigs/Projects/Figma-Relay/docs/parity-backlog.md)
- [VNext backlog](/Users/arigs/Projects/Figma-Relay/docs/vnext-backlog.md)
- [Changelog](/Users/arigs/Projects/Figma-Relay/CHANGELOG.md)

## Notes

- The bridge listens locally only.
- The plugin UI is intentionally tiny and status-focused.
- Reopen warnings are only shown when a plugin bundle mismatch actually matters.
- The bridge/runtime layer is designed to survive long local sessions and agent handoffs better than the average prototype bridge.

## Status

Current state:

- Figma support: ready
- FigJam support: ready
- Release summary: ready
- Core parity with the original target tool surface: closed

What remains is mostly polish, packaging, and future scope, not core capability work.
