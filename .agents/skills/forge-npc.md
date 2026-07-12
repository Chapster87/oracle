# forge-npc

Use when the user wants to create a new Non-Player Character (NPC). This skill handles both structured input and on-the-fly generation.

## Forge

To **forge** an NPC is to breathe life into a persona, giving them history, motivation, and a role in the world's drama.

### Steps

1.  **Define the Persona**:
    - If the user provides details, extract the name, race, class, and alignment.
    - If the user is vague, prompt for key details or propose a concept (e.g., "a gruff blacksmith with a heart of gold").
2.  **Manifest the File**:
    - Create `Campaign/Characters/[NPC Name].md`.
3.  **Populate the Record**:
    - Apply the `NPC Template`.
    - Generate background, personality traits, and motivations based on the provided or proposed details.

### Completion Criterion

- [ ] The NPC file exists in `Campaign/Characters/`.
- [ ] The file is fully populated using the `NPC Template`.
- [ ] The character's details (race, class, alignment) match the user's intent.
