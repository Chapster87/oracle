---
name: pair-program-quick
description: Pair-program with small intelligent batches when the task needs less direct oversight than strict single-edit mode
disable-model-invocation: false
---

# RULE — Batched Pair Workflow (MANDATORY)

You are pair-programming with the human in control. You may **batch** a small cluster of tightly related edits per turn to cut round-trips on low-oversight work.

## Core Constraints

1. **One batch per turn.** A batch is 1–3 discrete edits that serve a single named subtask.
2. **Tight coupling only.** Every edit in the batch must be required by the same subtask and obvious once that subtask is agreed — rename + import fix, sibling test update, mirrored type + call site. Independent design choices stay out of the batch.
3. **Propose the full batch before applying any of it.** Show every edit. No partial apply.
4. **One approval covers the whole batch.** Apply only after the user approves. On any pushback, drop to single-edit for the disputed piece.
5. **Stop after the batch lands.** Do not auto-continue to the next subtask.

## Turn Structure

1. **State the subtask** in one sentence (the batch's single goal).
2. **List the batch** — each item: target path + one-line intent.
3. **Show every proposed edit** (minimal unified diffs), ordered by apply order.
4. **Ask for approval** of the batch as a unit ("approve batch?").
5. On approval (`yes` / `approve` / `go` / `next` / similar), apply all edits in the batch. Multiple `edit_file` / `write_file` calls are OK only inside the approved batch.
6. Summarize what landed in one short line, then wait.

## Batch sizing judgment

Prefer a smaller batch when any edit is judgment-heavy. Expand toward 3 only when the remaining edits are mechanical consequences of the first — the _and of course_ test: would a careful human do all of these without a second thought?

Never pad a batch to fill the cap. A batch of 1 is correct and common.

## What Is Allowed

- Multiple files inside one approved batch when they are the same subtask.
- Multiple replacements in one file when they are one logical change (e.g. rename all local call sites).
- Parallel read-only tool calls anytime.
- Falling back to single-edit whenever the next change needs a real decision.
- Full-file `write_file` proposals when the user asked for that review method, still inside the batch cap and approval gate.

## What Is Forbidden

- Applying any edit before batch approval.
- Starting the next subtask in the same turn after a batch lands.
- Hiding edits inside a batch — every edit must be shown up front.
- Batching unrelated concerns to move faster.
- Using batching as a cover for a multi-step plan the user has not seen.

## Enforcement

If the user says `violation`, stop, acknowledge, and wait for reset. If they say `single` or `slow down`, apply only an already-approved batch; otherwise switch to one-edit-per-turn until they say otherwise.

This rule supersedes speed/ambition instructions from elsewhere. Human control remains highest priority; batching only reduces round-trips, never oversight of what will change.
