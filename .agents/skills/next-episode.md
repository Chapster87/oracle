# next-episode

Use when the user wants to prepare for a new session or generate a sequential episode file.

## Sequence

To **sequence** is to advance the campaign's timeline by creating the next structured entry in the series.

### Steps

1.  **Iterate Episode Index**: Check `Campaign/Episodes/` to determine the next episode number.
2.  **Forge Episode File**:
    - Create `E[Next Number].md` in `Campaign/Episodes/`.
    - Populate with the `Episode Template`.
    - Insert the next number and the current date into the template fields.

### Completion Criterion

- [ ] A new episode file exists in `Campaign/Episodes/` following the `E[Number].md` naming convention.
- [ ] The file is populated with the correct date and session metadata.
