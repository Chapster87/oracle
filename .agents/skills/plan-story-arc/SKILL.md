---
name: plan-story-arc
description: Use when the user wants to design a new story arc or manifest the resources (NPCs, locations) defined within an existing story arc plan.
---

## Arc

To **arc** is to bridge individual sessions into a grand narrative, preparing the world for the characters' journey.

### Steps

1.  **Draft the Narrative Arc**:
    - If creating a new arc, prompt for: name, target level range, session estimates, and session count.
    - Create `Campaign/Planning/Arc-[Name].md`.
    - Populate with the `Story Arc Template`, generating a session-by-session breakdown.
2.  **Manifest Resources**:
    - If processing an existing plan, scan the markdown for `[[Double Brackets]]`.
    - For each unique bracketed name, determine its type (NPC, Location, Faction, etc.).
    - If a file for the resource doesn't exist, create it in the appropriate directory using its respective template (e.g., `forge-npc` logic).
    - **Conversion**: Update the planning document to convert `[[Resource Name]]` into standard markdown links `[Resource Name](path/to/file.md)`.

### Completion Criterion

- [ ] The arc planning file exists in `Campaign/Planning/`.
- [ ] All major resources bracketed in the plan have corresponding files created.
- [ ] The planning file has been updated with valid markdown links to all resources.
