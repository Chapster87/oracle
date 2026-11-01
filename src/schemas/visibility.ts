import * as z from "zod"

import type { Visibility } from "@/types"

/**
 * The two-value visibility enum. `private` is the database default, so a write
 * that omits visibility fails closed (#44).
 */
export const visibilitySchema = z.enum(["public", "private"]) satisfies z.ZodType<Visibility>
