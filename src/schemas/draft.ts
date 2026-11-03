import * as z from "zod"

import { isEntityType } from "@/utils/entity"

const slotName = z.string().regex(/^secret_\d+$/, "Secrets are named secret_N.")

/** One secret-slot operation carried by a draft. */
export const slotOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("upsert"),
    slot: slotName,
    source_column: z.string().nullable().optional(),
    value: z.unknown(),
    audience: z.enum(["dm", "owner", "public"]).default("dm"),
    revealed_at: z.string().nullable().optional(),
    position: z.number().int().min(0).default(0),
  }),
  z.object({
    op: z.literal("delete"),
    slot: slotName,
  }),
])

/** The shape a lane's `propose_record` tool hands to the drafts DAL. */
export const proposeDraftSchema = z.object({
  kind: z.enum(["create", "update", "delete"]),
  model: z.string().refine(isEntityType, "Unknown entity type."),
  targetId: z.uuid().optional(),
  campaignId: z.uuid().nullable(),
  payload: z.record(z.string(), z.unknown()).default({}),
  slotOps: z.array(slotOpSchema).default([]),
  baseUpdatedAt: z.string().nullable().optional(),
  batchId: z.uuid(),
  lane: z.string().nullable().optional(),
  supersedes: z.uuid().nullable().optional(),
})
