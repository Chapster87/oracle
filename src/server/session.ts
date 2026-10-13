import type { Role } from "@/types"

/**
 * Prototype-only session helper.
 *
 * Real Supabase Auth is tracked as a separate ticket; until it lands the
 * server-rendered role is fixed to DM (matching `/world`). An optional
 * `?role=PLAYER` query override is accepted so the player RBAC path can be
 * exercised in the prototype. Remove the override once auth is wired up.
 */
export const PROTOTYPE_USER_ID = "4ce7ae1c-9681-4686-8019-5228d6e35ce7"

/**
 * Stand-in id for the prototype player. Deliberately distinct from the DM/owner
 * id above so the player view exercises the non-owner RBAC branch (the seeded
 * entities are all owned by `PROTOTYPE_USER_ID`).
 */
export const PROTOTYPE_PLAYER_ID = "11111111-1111-1111-1111-111111111111"

export interface Session {
  role: Role
  userId: string
}

export function getSession(roleOverride?: string | string[]): Session {
  const override = Array.isArray(roleOverride) ? roleOverride[0] : roleOverride
  const role: Role = override === "PLAYER" ? "PLAYER" : "DM"
  return {
    role,
    userId: role === "PLAYER" ? PROTOTYPE_PLAYER_ID : PROTOTYPE_USER_ID,
  }
}
