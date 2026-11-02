"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import Checkbox from "@components/checkbox"
import Field from "@components/field"
import Heading from "@components/heading"
import Input from "@components/input"
import RepeatableTextList from "@components/repeatable-text-list"
import { Select, SelectItem } from "@components/select"
import TagInput from "@components/tag-input"
import Text from "@components/text"
import Textarea from "@components/textarea"

export default function FormControlsDemoPage() {
  const [checked, setChecked] = useState(false)
  const [tags, setTags] = useState<string[]>(["Orc", "Undead"])
  const [aliases, setAliases] = useState<string[]>([
    "The Shattered Isles",
    "The Broken Coast",
  ])

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Form Controls
      </Heading>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "480px",
        }}
      >
        <Heading level="h3" display="h6">
          Input
        </Heading>
        <Field label="Name" help="The entity's display name.">
          <Input placeholder="e.g. The Shattered Isles" />
        </Field>
        <Field label="Email" error="Enter a valid email address.">
          <Input type="email" defaultValue="not-an-email" />
        </Field>
        <Field label="Disabled">
          <Input placeholder="Disabled input" disabled />
        </Field>
        <Field label="Search" help="Input with a leading icon.">
          <Input icon={<Search size={16} />} placeholder="Search lore..." />
        </Field>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "480px",
        }}
      >
        <Heading level="h3" display="h6">
          Textarea
        </Heading>
        <Field label="Description" help="Supports multiple lines.">
          <Textarea placeholder="Describe the entity..." rows={4} />
        </Field>
        <Field label="Description" error="Description is required.">
          <Textarea placeholder="Describe the entity..." rows={4} />
        </Field>
        <Field label="Disabled">
          <Textarea placeholder="Disabled textarea" rows={3} disabled />
        </Field>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "480px",
        }}
      >
        <Heading level="h3" display="h6">
          Select
        </Heading>
        <Field label="Entity type" help="Choose the kind of entity.">
          <Select placeholder="Select a type">
            <SelectItem value="character">Character</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="faction">Faction</SelectItem>
          </Select>
        </Field>
        <Field label="Entity type" error="Entity type is required.">
          <Select placeholder="Select a type">
            <SelectItem value="character">Character</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </Select>
        </Field>
        <Field label="Disabled">
          <Select placeholder="Disabled select" disabled>
            <SelectItem value="character">Character</SelectItem>
          </Select>
        </Field>
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "480px",
        }}
      >
        <Heading level="h3" display="h6">
          Checkbox
        </Heading>
        <Field label="Visibility" help="Controlled by the Field wrapper.">
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
          />
        </Field>
        <Checkbox label="Standalone checkbox with its own label" />
        <Checkbox label="Disabled checkbox" disabled />
      </section>

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "480px",
        }}
      >
        <Heading level="h3" display="h6">
          Composite
        </Heading>
        <Text size="sm">
          TagInput is for unordered, deduplicated short strings.
          RepeatableTextList is for ordered rows where position matters.
        </Text>
        <Field label="Tags" help="Press Enter to add. Duplicates are ignored.">
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Add a tag..."
          />
        </Field>
        <Field label="Aliases" help="Reorder rows with the arrow buttons.">
          <RepeatableTextList
            value={aliases}
            onChange={setAliases}
            addLabel="Add alias"
            minRows={1}
          />
        </Field>
      </section>
    </div>
  )
}
