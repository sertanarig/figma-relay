# Figma Relay VNext Backlog

This file is for post-parity work. None of the items below should block the `v1` release line.

## Product UX

- Expand the dashboard payload with richer cards and drill-down actions
- Add more productized grouping and sorting options to browser payloads
- Make troubleshooting summaries clearer for humans, not just for engineers

## Reporting Intelligence

- Add better heuristics and section-level comparisons to verification reports
- Design a richer suppression/waiver model for audit findings
- Make doc generation smarter about examples and naming collisions

## Performance

- Make component/style/token browser reads more incremental and cache-aware on large files
- Trim unnecessary repeated work from release-report steps
- Harden runtime heartbeat and reconnect behavior for long sessions

## Tool Surface Extensions

- Keep pushing beyond Figma Console with differentiators like:
  - release readiness trends
  - change impact summaries
  - component family health scoring
  - doc drift detection

## Shipping Rules

- Only pull from this list once the `v1` release line is clean
- Before adding new features, verify they do not regress parity or reliability
