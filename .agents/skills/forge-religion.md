# forge-religion

Use when the user wants to create a new religion, deity, or pantheon. This skill handles both structured input and on-the-fly generation.

## Forge

To **forge** a religion is to define the divine or spiritual forces that shape the world's beliefs and conflicts.

### Steps

1.  **Define the Divine**:
    - If the user provides details, extract the name and type (e.g., deity, faith, pantheon).
    - If the user is vague, prompt for key details or propose a concept (e.g., "a god of courage and self-sacrifice").
2.  **Manifest the File**:
    - Create `Campaign/Religions/[Religion Name].md`.
3.  **Populate the Record**:
    - Apply the `Religion Template`.
    - Generate lore, tenets, and descriptions of worship based on the provided or proposed details.

### Completion Criterion

- [ ] The religion file exists in `Campaign/Religions/`.
- [ ] The file is fully populated using the `Religion Template`.
