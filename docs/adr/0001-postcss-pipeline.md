# 0001 — Add a PostCSS pipeline for custom media and nesting

**Status:** Accepted
**Date:** 2026-10-31

## Context

Oracle's CSS modules use nesting (`&:hover`) and design tokens, but the project has no PostCSS configuration. The component workbench needs a breakpoint vocabulary so `BreakpointIndicator` can report the active breakpoint, and the starter repo expresses that vocabulary with `@custom-media` variables (`--viewport-xs`, `--viewport-md-up`, …).

`@custom-media` is not supported natively by Next.js's CSS handling. Without a pipeline, the breakpoint variables cannot resolve, and the alternative is to repeat raw `@media (max-width: …)` queries in every module.

## Decision

Add a PostCSS pipeline matching the starter repo:

- `@csstools/postcss-global-data` registers the breakpoint file so `@custom-media` resolves across CSS modules.
- `postcss-preset-env` (stage 3) enables nesting and custom media queries.
- `postcss-flexbugs-fixes` and `postcss-normalize` handle legacy flexbox and normalisation.

The breakpoint scale (`xxs` through `2xl`, max-width and min-width variants) lives in one file and is imported as global data.

## Consequences

- CSS modules can use `@media (--viewport-md-up)` and nested rules consistently.
- The project gains six devDependencies and a build-time transform it did not have before.
- Breakpoints are now a shared vocabulary; changing a breakpoint means editing one file.
- Future CSS features must be checked against the configured preset-env stage rather than assumed to work natively.
