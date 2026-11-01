import * as z from "zod"

import { accessFields, metadataSchemaFor, tags } from "./common"

const content = z.strictObject({
  name: z.string().trim().min(1).max(200),
  type: z.string().max(100).nullable().optional(),
  rarity: z.string().max(100).nullable().optional(),
  description: z.string().max(20_000).nullable().optional(),
  history: z.string().max(20_000).nullable().optional(),
  role_in_campaign: z.string().max(20_000).nullable().optional(),
  tags: tags.optional(),
  metadata: metadataSchemaFor("items").optional(),
})

export const itemCreateSchema = z.strictObject({
  ...content.shape,
  ...accessFields,
})

export const itemUpdateSchema = z
  .strictObject({
    ...content.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
