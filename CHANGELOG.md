# Changelog

All notable changes to this project will live here.

The tone is simple:

- if it shipped, it goes here
- if it mattered, it gets a line
- if it was only chaos in a late-night branch and never landed, history can keep that one

## [0.1.0] - 2026-03-25

### Added

- Figma Relay plugin runtime for Figma design files
- FigJam runtime support with live create/update/readback flows
- Local bridge with active runtime handoff and multi-agent reuse
- MCP stdio server with a broad read/write tool surface
- Design system reads and writes for variables, styles, components, comments, screenshots, verification, and reporting
- Batch operations for variables, styles, component instantiation, and instance properties
- Dashboard, audit, parity, troubleshooting, release-readiness, and reporting tools
- Smoke, stress, long-run, and release-check command suite
- FigJam board summary and dedicated FigJam report flows

### Changed

- Product-facing name is now **Figma Relay**
- Public docs were rewritten in English with an agent-agnostic positioning
- Plugin UI was simplified into a tiny status panel
- Runtime handoff and stale-session handling were hardened for local multi-agent use

### Notes

- Slides are intentionally out of scope for this release
- FigJam support is included as the first real working package, not just a placeholder bullet
- Core parity with the original target tool surface is considered closed for `v0.1.0`
