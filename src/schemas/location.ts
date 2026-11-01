import * as z from "zod"

import { accessFields, metadataSchemaFor, tags } from "./common"

const content = z.strictObject({
  name: z.string().trim().min(1).max(200),
  type: z.string().max(100).nullable().optional(),
  sub_type: z.string().max(100).nullable().optional(),
  region_id: z.uuid().nullable().optional(),
  overview: z.string().max(20_000).nullable().optional(),
  history: z.string().max(20_000).nullable().optional(),
  inhabitants: z.string().max(20_000).nullable().optional(),
  points_of_interest: z
    .array(z.string().trim().min(1).max(200))
    .max(100)
    .nullable()
    .optional(),
  map_data: z.string().nullable().optional(),
  tags: tags.optional(),
  metadata: metadataSchemaFor("locations").optional(),
})

export const locationCreateSchema = z.strictObject({
  ...content.shape,
  ...accessFields,
})

export const locationUpdateSchema = z
  .strictObject({
    ...content.partial().shape,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
