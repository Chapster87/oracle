"use client"

import { useState } from "react"

import Field from "@components/field"
import Heading from "@components/heading"
import SearchSelect, { type SelectOption } from "@components/search-select"
import Text from "@components/text"

/** The control is generic; a caller can carry any extra fields it likes. */
interface EntityOption extends SelectOption {
  type: string
}

const ENTITIES: EntityOption[] = [
  { id: "c1", label: "Sir Gideon Thorn", type: "characters" },
  { id: "c2", label: "High Commander Elara Vane", type: "characters" },
  { id: "c3", label: "Vesper Kane", type: "characters" },
  { id: "l1", label: "Whisperwind Forest", type: "locations" },
  { id: "l2", label: "Obsidian Marches", type: "locations" },
  { id: "f1", label: "The Scarlet Veil", type: "factions" },
  { id: "f2", label: "The Dawnwardens", type: "factions" },
]

const CAMPAIGNS: SelectOption[] = [
  { id: "camp-1", label: "The Shattered Isles" },
  { id: "camp-2", label: "The Broken Coast" },
  { id: "camp-3", label: "Ashfall Reach" },
]

export default function SearchSelectDemoPage() {
  const [campaign, setCampaign] = useState<string | null>(null)
  const [entity, setEntity] = useState<string | null>(null)
  const [region, setRegion] = useState<string | null>("l1")

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Search Select
      </Heading>
      <Text size="sm">
        Single-select and searchable, generic over any `{"{ id, label }"}` list.
        Options come from the caller; the control never queries anything.
      </Text>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "480px",
        }}
      >
        <Field label="Campaign" help="Plain options — no domain fields needed.">
          <SearchSelect
            options={CAMPAIGNS}
            value={campaign}
            onChange={setCampaign}
            placeholder="Select a campaign"
          />
        </Field>

        <Field
          label="Related entity"
          help="Callers keep their own option shape; filterOption narrows it."
        >
          <SearchSelect
            options={ENTITIES}
            value={entity}
            onChange={setEntity}
            placeholder="Select an entity"
          />
        </Field>

        <Field label="Region" help="Narrowed to locations via filterOption.">
          <SearchSelect
            options={ENTITIES}
            value={region}
            onChange={setRegion}
            filterOption={(option) => option.type === "locations"}
          />
        </Field>

        <Field label="Campaign" error="Choose a campaign.">
          <SearchSelect
            options={CAMPAIGNS}
            value={null}
            onChange={() => {}}
          />
        </Field>

        <Field label="Disabled">
          <SearchSelect
            options={CAMPAIGNS}
            value={null}
            onChange={() => {}}
            placeholder="Disabled picker"
            disabled
          />
        </Field>
      </section>
    </div>
  )
}
