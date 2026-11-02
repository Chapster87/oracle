import { notFound } from "next/navigation"

import Heading from "@components/heading"
import Link from "@components/link"

import { allowedFields, fieldSpecsFor } from "@/forms/registry"
import {
  createEntityAction,
  updateEntityAction,
} from "@/server/actions/entities"
import { getEntity } from "@/server/entities"
import { requireDmViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { supabaseAdmin } from "@/server/supabase"
import type { EntityType } from "@/types"
import { ENTITY_META } from "@/utils/entity"

import EntityForm from "./index"
import SecretSlotsPanel from "@components/secret-slots/secret-slots-panel"
import s from "./style.module.css"

async function loadOptions() {
  const [{ data: locations }, { data: campaigns }] = await Promise.all([
    supabaseAdmin.from("locations").select("id, name").order("name"),
    supabaseAdmin.from("campaigns").select("id, name").order("name"),
  ])

  return {
    locations: (locations ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
    campaigns: (campaigns ?? []).map((row) => ({
      id: row.id,
      label: row.name,
    })),
  }
}

/** Flattens an entity row into the spec-name keys the form expects. */
function initialValues(
  type: EntityType,
  entity: Record<string, unknown>
): Record<string, unknown> {
  const metadata = (entity.metadata ?? {}) as Record<string, unknown>
  const values: Record<string, unknown> = {}

  for (const spec of fieldSpecsFor(type)) {
    if (spec.name.startsWith("metadata.")) {
      const key = spec.name.slice("metadata.".length)
      values[spec.name] = metadata[key] ?? ""
    } else {
      values[spec.name] = entity[spec.name] ?? ""
    }
  }

  return values
}

/**
 * Server-side assembly shared by every create/edit route: resolves the viewer,
 * loads the option lists, prefills the row on edit, and hands the form its
 * action.
 */
export default async function EntityFormPage({
  type,
  mode,
  id,
}: {
  type: EntityType
  mode: "create" | "edit"
  id?: string
}) {
  const viewer = await requireDmViewer()
  const { active } = await getCampaignContext()

  const specs = allowedFields(fieldSpecsFor(type), viewer)
  const options = await loadOptions()

  let initial: Record<string, unknown> = {}
  let baseUpdatedAt: string | null = null

  if (mode === "edit") {
    if (!id) notFound()

    const data = await getEntity(
      type,
      id,
      viewer.role,
      viewer.userId,
      active?.id ?? null
    )
    if (!data) notFound()

    const entity = data.entity as unknown as Record<string, unknown>
    initial = initialValues(type, entity)
    baseUpdatedAt = (entity.updated_at as string | undefined) ?? null
  }

  const label = ENTITY_META[type].singular
  const backHref = mode === "edit" && id ? `/${type}/${id}` : `/${type}`
  const backLabel =
    mode === "edit" && initial.name
      ? String(initial.name)
      : ENTITY_META[type].label

  return (
    <div className={s.page}>
      <Link href={backHref} className={s.back}>
        ← Back to {backLabel}
      </Link>

      <Heading level="h1" style={{ marginBottom: "24px" }}>
        {mode === "edit" ? `Edit ${label}` : `New ${label}`}
      </Heading>

      <EntityForm
        type={type}
        mode={mode}
        specs={specs}
        initial={initial}
        entityId={id}
        baseUpdatedAt={baseUpdatedAt}
        options={options}
        action={mode === "edit" ? updateEntityAction : createEntityAction}
      />

      {mode === "edit" &&
        id &&
        (viewer.role === "DM" || viewer.role === "ADMIN") && (
          <SecretSlotsPanel type={type} entityId={id} />
        )}
    </div>
  )
}
