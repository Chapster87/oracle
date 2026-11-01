import * as z from "zod"

import { accessFields, metadataSchemaFor } from "./common"

/** `players` has no `tags` column, so it is deliberately absent here. */
const content = z.strictObject({
  name: z.string().trim().min(1).max(200),
  species: z.string().max(100).nullable().optional(),
  class_es: z.string().max(100).nullable().optional(),
  alignment: z.string().max(100).nullable().optional(),
  level: z.number().int().min(1).max(20).nullable().optional(),
  homeland_id: z.uuid().nullable().optional(),
  hometown_id: z.uuid().nullable().optional(),
  background: z.string().max(20_000).nullable().optional(),
  backstory: z.string().max(20_000).nullable().optional(),
  metadata: metadataSchemaFor("players").optional(),
})

export const playerCreateSchema = z.strictObject({
  ...content.shape,
  ...accessFields,
})

export const playerUpdateSchema = z
  .strictObject({
    ...content.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
