import * as z from "zod"

import { accessFields, metadataSchemaFor, tags } from "./common"

const resourceRef = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(100),
})

const neededResources = z.object({
  major: z.array(resourceRef).default([]),
  minor: z.array(resourceRef).default([]),
})

const fields = z.strictObject({
  name: z.string().trim().min(1).max(200),
  status: z.enum(["planned", "active", "completed"]).optional(),
  target_level: z.string().max(50).nullable().optional(),
  session_count: z.number().int().min(0).max(100).nullable().optional(),
  overview: z.string().max(20_000).nullable().optional(),
  content: z.string().max(100_000).nullable().optional(),
  needed_resources: neededResources.nullable().optional(),
  tags: tags.optional(),
  metadata: metadataSchemaFor("story_arcs").optional(),
})

export const storyArcCreateSchema = z.strictObject({
  ...fields.shape,
  ...accessFields,
})

export const storyArcUpdateSchema = z
  .strictObject({
    ...fields.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
