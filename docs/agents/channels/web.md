# Web Channel Binding

This channel runs inside the Oracle web app. The verbs in the skills map onto the app's database and routes:

- **Manifest a record** means calling `propose_record` with the target `model` and the record `data`. It creates a draft; it does not write to the live tables.
- **The DM approves** every draft before it reaches the database. You never call `create_record`, `update_record`, or `delete_record`.
- **Links** are app routes, not local markdown links: `/characters/<id>`, `/locations/<id>`, `/religions/<id>`, `/story-arcs/<id>`.
- **Completion** means the proposal is staged and the DM can review it. Do not claim the record exists until it is promoted.
- **Read tools** are available: `get_records`, `get_record_by_id`, and `check_migrations`. Use them to check continuity and avoid duplicates.

## Planning an arc

Work with the DM before proposing. Ask for the arc's name, target level, session count, and central conflict if they are not already clear. Then call `propose_record` with `model: "story_arcs"` and `data` containing `name`, `status: "planned"`, `target_level`, `session_count`, `overview`, `content` (the full plan markdown following the Story Arc Template), and `needed_resources`. Propose each needed resource as its own `propose_record` call so the DM can review them one at a time.

## Record fields

Use the field names the schema accepts. Unknown fields are rejected.

- `characters`: `name`, `species`, `class`, `alignment`, `appearance`, `personality`, `role`, `is_deceased`, `tags`.
- `locations`: `name`, `type`, `sub_type`, `region_id`, `overview`, `history`, `inhabitants`, `points_of_interest`, `map_data`, `tags`.
- `religions`: `name`, `type`, `overview`, `domains_teachings`, `worship_rituals`, `clergy_followers`, `history_myths`, `role_in_campaign`, `tags`.
- `story_arcs`: `name`, `status` (`planned | active | completed`), `target_level`, `session_count`, `overview`, `content` (the full plan markdown), `needed_resources` (`{ major: [{ name, type }], minor: [{ name, type }] }`), `tags`.
