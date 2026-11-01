import type { Role, Visibility } from "@/types"

/** Who is asking. `role` is the profile role, not a campaign membership role. */
export interface Viewer {
  userId: string
  role: Role
}

/** The scope columns every entity row carries. */
export interface EntityScope {
  campaignId: string | null
  ownerId: string | null
  visibility: Visibility
}

/** Whether the viewer runs a campaign (its owner, or a member whose role is DM). */
export type CampaignRoleCheck = (campaignId: string) => boolean

/**
 * The write predicate, mirroring `private.can_write_scope` in SQL: ADMIN
 * anywhere, a global DM for global rows, a campaign DM for that campaign.
 * Ownership is visibility, never a write grant.
 */
export function canWrite(
  viewer: Viewer,
  scope: EntityScope,
  isCampaignDm: CampaignRoleCheck
): boolean {
  if (viewer.role === "ADMIN") return true
  if (scope.campaignId === null) return viewer.role === "DM"
  return isCampaignDm(scope.campaignId)
}

/**
 * The read predicate, mirroring `private.can_view_row` in SQL. A campaign row
 * is invisible outside its campaign, even when public.
 */
export function canRead(
  viewer: Viewer,
  scope: EntityScope,
  isCampaignDm: CampaignRoleCheck,
  isCampaignMember: CampaignRoleCheck
): boolean {
  if (viewer.role === "ADMIN") return true

  const isPublicOrOwned =
    scope.visibility === "public" || scope.ownerId === viewer.userId

  if (scope.campaignId === null) {
    return viewer.role === "DM" || isPublicOrOwned
  }

  if (isCampaignDm(scope.campaignId)) return true
  if (!isCampaignMember(scope.campaignId)) return false
  return isPublicOrOwned
}
