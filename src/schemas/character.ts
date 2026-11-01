import * as z from "zod"

import { accessFields, metadataSchemaFor, tags } from "./common"

const content = z.strictObject({
  name: z.string().trim().min(1).max(200),
  species: z.string().max(100).nullable().optional(),
  class: z.string().max(100).nullable().optional(),
  alignment: z.string().max(100).nullable().optional(),
  appearance: z.string().max(20_000).nullable().optional(),
  personality: z.string().max(20_000).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  is_deceased: z.boolean().optional(),
  tags: tags.optional(),
  metadata: metadataSchemaFor("characters").optional(),
})

export const characterCreateSchema = z.strictObject({
  ...content.shape,
  ...accessFields,
})

export const characterUpdateSchema = z
  .strictObject({
    ...content.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
