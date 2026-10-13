---
name: chronicle-story
description: Use when the user wants to summarize a recent episode, update the campaign's story log, or record the consequences of player actions on the world's NPCs, locations, and factions.
---

## Chronicle

To **chronicle** is to weave the threads of a session into the permanent tapestry of the campaign, ensuring every action has a recorded reaction.

### Steps

1.  **Extract the Narrative**: Read the most recent episode file from `Campaign/Episodes/`.
2.  **Summarize Key Events**: Distill the session notes into a concise summary.
3.  **Update Story Log**:
    - Format the summary using the `Story Log Entry Template`.
    - Prepend the formatted summary to `Campaign/_StoryLog.md`.
    - Identify all content used (NPCs, locations, items, etc.) and add them as a linked list under the `### Content Used` section.
4.  **Propagate Consequences**:
    - Identify every location, character, and faction mentioned.
    - For each, append a summary of their role/events in the session to their respective `Role in Campaign` section.
    - For player characters, append their significant contributions to their `Campaign Notes` section.
5.  **Finalize State Changes**:
    - Move completed quest hooks from `Campaign/Quest Hooks/` to `Campaign/Quest Hooks/Complete/`.
    - Move completed puzzles from `Campaign/Puzzles/` to `Campaign/Puzzles/Complete/`.
    - Update status to "Completed" in the files and update any relevant location files with the `(Completed)` tag.

### Completion Criterion

- [ ] `Campaign/_StoryLog.md` has the new entry at the top with a full `Content Used` list.
- [ ] Every mentioned entity (NPC, Location, Faction, PC) has an updated "Role in Campaign" or "Campaign Notes" entry reflecting the session.
- [ ] All completed assets (Quests/Puzzles) are moved to their respective `/Complete/` directories and status updated.
