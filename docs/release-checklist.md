# Figma Relay V1 Release Checklist

## Release Gate

- `npm run release:check`
- `npm run release:report`
- `npm run release:summary`

`release:check` is the fast, blocking release gate.

`release:report` dumps the full smoke/stress path as JSON.

`release:summary` gives the same path in a short human-readable form.

## Required Green Checks

- Unit/integration tests green
- TypeScript build green
- `smoke:e2e` green
- `smoke:styles` green
- `smoke:stress` green
- `smoke:write-stress` green
- `smoke:mixed-stress` green
- `smoke:large-file` green
- comments smoke green
- component property smoke green

## Runtime Preconditions

- The `Figma Relay` plugin must be open
- An active runtime must be connected
- Required secrets must be present in `.env.local`
- `FIGMA_ACCESS_TOKEN` must be available when REST-backed tools need it

## Manual Spot Checks

- Does the dashboard return a sensible `health.status`?
- Does the design system report return meaningful `recommendedActions`?
- Are component doc examples readable?
- Does the verification report produce believable readiness/finding distributions?
- Does the new-build warning stay quiet unless it really matters?

## Performance Checks

- `npm run smoke:stress -- --iterations=20`
- `npm run smoke:write-stress -- --iterations=5`
- `npm run smoke:mixed-stress -- --iterations=2`
- `npm run smoke:large-file`
- `npm run smoke:long-run -- --loops=1`

Expected:

- The read-heavy smoke should not fail
- The write-heavy smoke should not fail
- The mixed stress run should not fail
- The large-file smoke should complete real inventory reads on the active file
- The runtime connection should stay up through the long-run smoke

## Cache Notes

These surfaces are currently quieted with short-lived caches:

- design system inventory
- component detail/image
- dashboard
- design system report
- verification report

The goal is simple: when the same calls happen again a few seconds later, avoid hammering the runtime for no reason. This is not a persistence layer. It is just a small “everybody relax” buffer.

## Ship Criteria

- `release:summary` should return `ready`
- The parity backlog should be empty
- There should be no known blocking bug
- Plugin reopen should only be required when the plugin main bundle actually changed

## After V1

- New work should go to the `vnext` backlog, not back into parity
- The V1 line should only take bugfixes, reliability work, and release blockers
