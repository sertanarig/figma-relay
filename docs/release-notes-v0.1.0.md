# Figma Relay v0.1.0

This is the first public release of **Figma Relay**.

It is a local, agent-agnostic bridge between Figma/FigJam and MCP-compatible clients. In plain English: keep the plugin open, keep the bridge running, and let your client talk to a real live canvas without turning the session into a reconnect festival.

## What shipped

- Support for **Figma design files**
- First working support package for **FigJam**
- Local bridge + MCP stdio server
- Multi-agent handoff on the same runtime
- Read/write tools for:
  - nodes
  - variables
  - styles
  - components
  - comments
  - screenshots
  - verification/reporting
- Batch operations for common design-system workflows
- Audit, parity, troubleshooting, dashboard, and release-readiness tooling
- Smoke, stress, long-run, and release-check scripts

## What is intentionally out of scope

- Slides

That is not an accident. It is a boundary.

## Release posture

`v0.1.0` is meant to be a strong local-first foundation:

- core parity: closed
- Figma support: ready
- FigJam support: ready
- release summary: ready

What remains after this release is mostly polish, packaging, and future scope, not missing core capability.

## A tiny origin story

This project started as a practical, slightly sleep-deprived, vibe-coded evolution inspired by the original Figma Console direction.

Then it got tests. And smoke scripts. And release gates. Which is usually how you can tell a side quest is becoming an actual product.

## Recommended first steps

1. Build the plugin
2. Start the local bridge
3. Open `Figma Relay` in Figma or FigJam
4. Run `npm run runtime:handoff`
5. Run `npm run smoke:e2e`
6. If you are in FigJam, also run `npm run smoke:figjam`

## Useful links

- [README](/Users/arigs/Projects/Figma-Relay/README.md)
- [Release checklist](/Users/arigs/Projects/Figma-Relay/docs/release-checklist.md)
- [MCP tool surface](/Users/arigs/Projects/Figma-Relay/docs/mcp-tools.md)
- [VNext backlog](/Users/arigs/Projects/Figma-Relay/docs/vnext-backlog.md)
