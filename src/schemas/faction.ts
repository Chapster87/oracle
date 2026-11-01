import * as z from "zod"

import { accessFields, metadataSchemaFor, tags } from "./common"

const content = z.strictObject({
  name: z.string().trim().min(1).max(200),
  alignment: z.string().max(100).nullable().optional(),
  overview: z.string().max(20_000).nullable().optional(),
  goals: z.string().max(20_000).nullable().optional(),
  beliefs: z.string().max(20_000).nullable().optional(),
  tags: tags.optional(),
  metadata: metadataSchemaFor("factions").optional(),
})

export const factionCreateSchema = z.strictObject({
  ...content.shape,
  ...accessFields,
})

export const factionUpdateSchema = z
  .strictObject({
    ...content.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
