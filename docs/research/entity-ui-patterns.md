# Research: UI Pattern for Entity Detail Views

## Goal

Establish a "Viewer-First" UI pattern for entity detail views (Characters, Locations, Factions) that balances player-facing lore with DM-specific secrets and management tools.

## Core Pattern: The "Layered Detail" View

### 1. Header Section (Public Identity)

- **Title**: Large, bold entity name.
- **Sub-header**: Species/Class (Characters), Type/Sub-type (Locations), or Alignment (Factions).
- **Tags**: Visual badges for quick categorization (e.g., "Ally", "Hostile", "Essential").
- **Badge**: Distinctive Role/Visibility badge (e.g., "Public", "Private").

### 2. Tabbed Navigation (The Content Layers)

To keep the UI clean, content should be split into logical tabs:

- **Overview (Public)**: General description, appearance, and immediate lore.
- **Details (Public/Private)**: Deeper history, inhabitants, or beliefs.
- **Relationships (Public)**: Linked entities (e.g., "Member of [Faction]", "Located in [Region]").
- **DM Notes (Secret)**: Only visible to DM/Owner. Contains the `secrets` or `rumors_lore` fields.

### 3. The "Private Log" Visual Treatment

DM-only content should use the established visual pattern from the prototype:

- **Background**: `#fff5f5` (Light Red).
- **Border**: `1px solid #991b1b`.
- **Title Color**: `#991b1b`.
- **Context**: A "DM Note (Hidden)" label to provide constant feedback that this is not visible to players.

## Entity-Specific Layouts

### Characters

- **Primary Data**: `species`, `class`, `alignment`, `appearance`.
- **Primary Narrative**: `personality`, `role`.
- **Secret Layer**: `secrets`.
- **Visuals**: Profile placeholder for avatar, status badge (e.g., "Alive" vs "Deceased").

### Locations

- **Primary Data**: `type`, `sub_type`, `region_id` (linked).
- **Primary Narrative**: `overview`, `history`, `inhabitants`.
- **Interaction**: `points_of_interest` list, `map_data` placeholder.
- **Secret Layer**: `rumors_lore`.

### Factions

- **Primary Data**: `alignment`.
- **Primary Narrative**: `overview`, `goals`, `beliefs`.
- **Secret Layer**: DM notes (via metadata).

## RBAC Enforcement at UI Level

- **Player View**: Filters out any `visibility: secret` or `visibility: private` entities unless they are the owner. Automatically hides the "DM Notes" tab.
- **DM View**: Shows all tabs. Adds "Edit" actions to every field/section.
- **Shared View**: Public entities show the same lore to everyone, but the DM sees additional "Internal Notes" sections embedded or as a separate tab.

## Implementation Details

### UI Library: Radix UI

- Use **Radix UI Primitives** (Tabs, Dialog, etc.) for complex UI interactions to ensure accessibility and consistent behavior.
- Create global wrappers around Radix primitives to enforce project-specific styling (CSS Modules) and patterns.

## Recommended Next Steps

- [ ] Install and configure Radix UI primitives.
- [ ] Create a `DetailView` component that accepts an entity type and data.
- [ ] Implement `TabGroup` and `TabPanel` components (Radix-based) for navigation.
- [ ] Build specialized "InfoCard" components for entity-specific fields (e.g., `CharacterStatCard`, `LocationRegionCard`).
