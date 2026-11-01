import * as z from "zod"

import { accessFields, metadataSchemaFor, tags } from "./common"

const content = z.strictObject({
  name: z.string().trim().min(1).max(200),
  type: z.string().max(100).nullable().optional(),
  overview: z.string().max(20_000).nullable().optional(),
  domains_teachings: z.string().max(20_000).nullable().optional(),
  worship_rituals: z.string().max(20_000).nullable().optional(),
  clergy_followers: z.string().max(20_000).nullable().optional(),
  history_myths: z.string().max(20_000).nullable().optional(),
  role_in_campaign: z.string().max(20_000).nullable().optional(),
  tags: tags.optional(),
  metadata: metadataSchemaFor("religions").optional(),
})

export const religionCreateSchema = z.strictObject({
  ...content.shape,
  ...accessFields,
})

export const religionUpdateSchema = z
  .strictObject({
    ...content.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
