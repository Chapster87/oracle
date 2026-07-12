# forge-location

Use when the user wants to create a new location, settlement, region, or dungeon. This skill handles both structured input and on-the-fly generation based on loose concepts.

## Forge

To **forge** a location is to give physical form and cultural weight to a point on the campaign map.

### Steps

1.  **Define the Essence**:
    - If the user provides details, extract the name, type, and theme.
    - If the user is vague, prompt for key details or propose a concept (e.g., "a bustling port town with a seedy underbelly").
2.  **Manifest the Files**:
    - **Dungeons**: `Campaign/Locations/Dungeons/[Name].md`
    - **Regions**: `Campaign/Locations/Regions/[Name].md`
    - **Settlements/Other**: `Campaign/Locations/Settlements/[Name].md`
3.  **Populate the Record**:
    - Apply the `Location Template`.
    - If a dungeon, generate 1-2 unique puzzles and record them in `Campaign/Puzzles/[Puzzle Name].md`, then link them in the dungeon file.
4.  **Visualize (Optional)**:
    - Ask the user if they want an ASCII map.
    - If yes, generate the map within the `Map` section of the file.

### Completion Criterion

- [ ] The location file exists in the correct subdirectory.
- [ ] The file follows the `Location Template` and includes relevant NPCs and points of interest.
- [ ] Any associated puzzles are created and linked correctly.
- [ ] If requested, an ASCII map is present.
