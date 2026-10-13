import { createClient } from "@supabase/supabase-js"
import type {
  Entity,
  EntityDetailData,
  EntityType,
  Location,
  RelatedEntity,
  Visibility,
} from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/** Entity tables that have a public detail route. */
const ENTITY_TYPES: EntityType[] = ["characters", "locations", "factions"]

/** Tables consulted when resolving a related entity id back to a name. */
const RESOLVABLE_TABLES: (EntityType | "world_lore")[] = [
  "characters",
  "locations",
  "factions",
  "world_lore",
]

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Removes DM-only fields from an entity before it is sent to a player.
 * Mirrors the RLS intent (viewers see the entity, not its secrets).
 */
function stripSecrets(type: EntityType, entity: Entity): Entity {
  const sanitized = { ...entity } as Record<string, any>

  if (type === "characters") {
    delete sanitized.secrets
  }

  if (type === "locations") {
    delete sanitized.rumors_lore
  }

  if (type === "factions" && sanitized.metadata) {
    const { dm_notes: _dmNotes, ...metadata } = sanitized.metadata
    sanitized.metadata = metadata
  }

  return sanitized as Entity
}

interface RelatedRow {
  id: string
  name: string
  visibility: Visibility
  owner_id: string | null
}

interface Viewer {
  isDM: boolean
  userId: string
}

/**
 * Resolves a batch of entity ids to their names and owning table. Entries the
 * viewer may not see (private/secret and not owned) are omitted, so a player
 * cannot learn the names of hidden entities through the relationships tab.
 */
async function resolveNames(
  ids: string[],
  viewer: Viewer
): Promise<Map<string, { name: string; type: RelatedEntity["type"] }>> {
  const map = new Map<string, { name: string; type: RelatedEntity["type"] }>()

  if (ids.length === 0) return map

  const isVisible = (row: RelatedRow) =>
    viewer.isDM || row.visibility === "public" || row.owner_id === viewer.userId

  await Promise.all(
    RESOLVABLE_TABLES.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select("id, name, visibility, owner_id")
        .in("id", ids)

      if (error) return
      ;(data ?? []).forEach((row: RelatedRow) => {
        if (!isVisible(row)) return
        map.set(row.id, { name: row.name, type: table })
      })
    })
  )

  return map
}

/** Loads every relation touching the entity, resolved to display names. */
async function getRelatedEntities(
  entityId: string,
  viewer: Viewer
): Promise<RelatedEntity[]> {
  const { data, error } = await supabase
    .from("entity_relations")
    .select("source_id, target_id, relation_type")
    .or(`source_id.eq.${entityId},target_id.eq.${entityId}`)

  if (error || !data) return []

  const otherIds = data.map((rel) =>
    rel.source_id === entityId ? rel.target_id : rel.source_id
  )
  const resolved = await resolveNames(otherIds, viewer)

  // The seed data stores each relationship in both directions; collapse the two
  // rows into a single entry per related entity.
  const byRelated = new Map<string, RelatedEntity>()

  for (const rel of data) {
    const otherId = rel.source_id === entityId ? rel.target_id : rel.source_id
    const match = resolved.get(otherId)
    if (!match) continue

    byRelated.set(`${otherId}|${rel.relation_type}`, {
      id: otherId,
      name: match.name,
      type: match.type,
      relationType: rel.relation_type,
    })
  }

  return Array.from(byRelated.values())
}

/** Resolves a location's parent region to a minimal link. */
async function getRegion(
  regionId?: string | null
): Promise<{ id: string; name: string } | null> {
  if (!regionId) return null

  const { data } = await supabase
    .from("locations")
    .select("id, name")
    .eq("id", regionId)
    .maybeSingle()

  return data ? { id: data.id, name: data.name } : null
}

/**
 * Fetches a single entity for the detail view, applying RBAC in the data layer.
 *
 * Players may only view public entities or entities they own, and DM-only
 * fields are stripped before returning. Returns `null` when the entity does not
 * exist or the viewer is not allowed to see it (callers should 404).
 *
 * @param type   The entity table to load from.
 * @param id     The entity id (validated as a UUID before querying).
 * @param role   The current user's role.
 * @param userId The current user's id.
 */
export async function getEntity(
  type: EntityType,
  id: string,
  role: string,
  userId: string
): Promise<EntityDetailData | null> {
  if (!ENTITY_TYPES.includes(type)) return null
  if (!UUID_RE.test(id)) return null

  const { data, error } = await supabase
    .from(type)
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const entity = data as Entity
  const isDM = role === "DM"

  const isVisibleToPlayer =
    entity.visibility === "public" || entity.owner_id === userId
  if (!isDM && !isVisibleToPlayer) return null

  const visible = isDM ? entity : stripSecrets(type, entity)
  const viewer: Viewer = { isDM, userId }

  const [related, region] = await Promise.all([
    getRelatedEntities(id, viewer),
    type === "locations"
      ? getRegion((entity as Location).region_id)
      : Promise.resolve(null),
  ])

  return {
    type,
    entity: visible,
    related,
    region,
  }
}
