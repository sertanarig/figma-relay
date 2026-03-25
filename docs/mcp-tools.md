# MCP Tool Surface

## Runtime

- `figma_get_status`
- `figma_list_open_files`
- `figma_reconnect`

Bridge runtime sync:

- Plugin UI publishes `runtime:hello` and `runtime:context` into the local bridge.
- Bridge exposes the latest active runtime at `GET /runtime/active`.
- MCP stdio resolves the active runtime session automatically unless `CODEX_FIGMA_RUNTIME_SESSION_ID` is set.
- MCP executor rejects calls when the active runtime does not advertise the required capability for that tool.

## Read

- `figma_get_selection`
- `figma_get_node`
- `figma_get_children`
- `figma_get_file_context`
- `figma_get_file_data`
- `figma_get_screenshot`
- `figma_get_variables`
- `figma_get_components`
- `figma_get_bound_variables`
- `figma_get_design_system_summary`
- `figma_get_dashboard`
- `figma_generate_change_impact_summary`
- `figma_get_release_readiness`
- `figma_get_release_readiness_trend`
- `figma_get_troubleshooting_summary`
- `figma_get_design_system_kit`
- `figma_browse_tokens`
- `figma_browse_design_system`
- `figma_get_token_values`
- `figma_generate_design_system_report`

## Write

- `figma_create_node`
- `figma_delete_node`
- `figma_move_node`
- `figma_resize_node`
- `figma_rename_node`
- `figma_set_text`
- `figma_set_fills`
- `figma_set_strokes`
- `figma_set_layout`
- `figma_bind_variable`
- `figma_batch_bind_variables`
- `figma_set_variable_mode`
- `figma_apply_style`
- `figma_batch_apply_styles`
- `figma_create_style`
- `figma_delete_style`
- `figma_cleanup_artifacts`
- `figma_clone_node`
- `figma_create_child`

## Variables

- `figma_create_variable_collection`
- `figma_add_mode`
- `figma_rename_mode`
- `figma_create_variable`
- `figma_batch_create_variables`
- `figma_update_variable`
- `figma_batch_update_variables`
- `figma_delete_variable`
- `figma_rename_variable`
- `figma_delete_variable_collection`
- `figma_setup_design_tokens`

## Components

- `figma_create_component`
- `figma_search_components`
- `figma_get_component_details`
- `figma_get_component`
- `figma_get_component_property_catalog`
- `figma_get_component_family_health`
- `figma_get_component_image`
- `figma_add_component_property`
- `figma_edit_component_property`
- `figma_delete_component_property`
- `figma_instantiate_component`
- `figma_batch_instantiate_components`
- `figma_set_instance_properties`
- `figma_batch_set_instance_properties`

## Debug

- `figma_get_operation_trace`
- `figma_get_design_changes`
- `figma_get_console_logs`
- `figma_take_screenshot`
- `figma_generate_verification_report`

## Audit

- `figma_audit_design_system`
- `figma_get_audit_waivers`
- `figma_upsert_audit_waiver`
- `figma_delete_audit_waiver`
- `figma_get_component_for_development`
- `figma_check_design_parity`
- `figma_generate_component_doc`
- `figma_detect_doc_drift`

Audit payload:

- reads file context, local styles, variables, and components
- reports inventory counts
- reports simple naming-health findings for variables/components
- returns a coarse score from `0-100`
- can suppress accepted findings through local audit waivers stored under `.figma-runtime-mcp/`

Parity payload:

- compares expected component/style/variable names against active Figma inventories
- reports `matched`, `missing`, and `extra`
- returns a coarse match score from `0-100`

Component doc payload:

- finds a component by name from active component inventory
- suggests likely related styles and variables
- returns compact markdown for handoff/documentation

Doc-drift payload:

- maps a component family to a matching `* Documentation` section when possible
- flags missing property mentions from sampled documentation content
- returns a drift status and concrete follow-up suggestions

Screenshot payloads:

- Screenshot tool outputs now include both `imageRef` and an inline `dataUrl`.
- `dataUrl` is the portable path for agent-side validation; `imageRef` remains available for local runtime debugging.
- Verification reports now also return lightweight recommendations alongside findings.

Dashboard payload:

- includes runtime connection health and capability count
- includes summary highlights for top components, styles, and variable collections
- includes a normalized health status derived from audit score
- includes the top recent audit issues for quick triage
- includes app-like panels and next actions for quick operator decisions

Change-impact payload:

- groups recent design changes into impacted areas
- resolves a sample of changed node names when possible
- suggests which smoke/regression checks are worth rerunning

Release-readiness payload:

- converts dashboard and design-system report data into simple v1 gates
- reports `ready`, `watch`, or `not-ready`
- helps keep release scope bounded instead of endlessly expanding “nice to have” work

Release-readiness trend payload:

- stores a local snapshot history under `.figma-runtime-mcp/`
- compares the latest readiness state with the previous one
- reports whether release health is improving, steady, or regressing

Design-system report payload:

- combines inventory counts, dashboard health, audit category scores, grouped browser data, and markdown
- meant for quick release/readiness or handoff reporting without manually stitching multiple tools together

## Comments

- `figma_get_comments`
- `figma_get_inline_comments`
- `figma_get_comment_replies`
- `figma_get_comment_thread`
- `figma_get_node_comments`
- `figma_post_comment`
- `figma_post_inline_comment`
- `figma_reply_to_comment`
- `figma_delete_comment`

## Manual Smoke Flow

1. Start the bridge with `node bridge/server.mjs`.
2. Start the MCP server with `npm run mcp:stdio`.
3. Open the Figma plugin UI and wait for the runtime ready log.
4. Verify bridge state with `curl http://localhost:3210/runtime/active`.
5. Call `figma_get_status` from the MCP client and confirm the returned `runtimeSessionId` matches the bridge payload.
6. Create a simple node with `figma_create_node`.
7. Read it back with `figma_get_selection` or `figma_get_node`.

## Stress Scripts

- `npm run smoke:stress`
- `npm run smoke:write-stress`
- `npm run smoke:mixed-stress`
- `npm run smoke:large-file`
- `npm run smoke:long-run`
- `npm run smoke:comments`
- `npm run smoke:component-properties`
- `npm run release:check`
- `npm run release:report`

## Automated Smoke Flow

- Run `npm run smoke:e2e` after the bridge is up and the plugin UI is connected.
- The script checks bridge health, verifies an active runtime, connects through stdio MCP, lists tools, and calls `figma_get_status`.
- Use `npm run smoke:e2e -- --allow-no-runtime` when validating local setup before opening Figma.
- Run `npm run smoke:stress -- --iterations=20` for a read-heavy regression pass across status, context, selection, styles, variables, and components.
- Run `npm run smoke:write-stress -- --iterations=5` for a write-heavy regression pass across create, rename, move, resize, text, fills, clone, and cleanup.
- Run `npm run smoke:large-file -- --component-limit=25 --depth=2` for heavier inventory, tree, kit, browser, and dashboard reads on the active file.
- Run `npm run smoke:long-run -- --loops=3` for repeated read/write/mixed/large-file regression loops.
- Run `npm run demo:simulated` for a full green demo without opening Figma.
- Run `npm run demo:live` to wait for a real plugin runtime instead of accepting the simulator.
