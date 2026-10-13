---
name: share-content
description: Use when the user wants to generate a player-safe, spoiler-free version of a campaign document.
---

## Share

To **share** is to reveal the world's surface to the players while keeping its machinery hidden.

### Steps

1.  **Sanitize the Record**:
    - Read the source markdown file.
    - Create a new file with `-Share` appended to the name (e.g., `Location-Share.md`).
2.  **Strip the Machinery**:
    - Remove all markdown links `[text](link)` and replace them with just the plain `text`.
    - Remove all bracketed placeholders and hidden notes, such as `(A summary of...)` or `(Copy/paste...)`.
    - Ensure no sensitive "GM-only" sections (if identified by common patterns) remain.
3.  **Validate Output**:
    - Confirm the resulting file is a flat, copy-pastable markdown document suitable for player consumption.

### Completion Criterion

- [ ] A sanitized `-Share.md` version of the file exists.
- [ ] No functional markdown links or GM-facing placeholders remain in the shareable file.
