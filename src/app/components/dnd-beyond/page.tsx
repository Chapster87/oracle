import Heading from "@components/heading"
import DndBeyondLink from "@components/dnd-beyond"

export default function DndBeyondDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        D&D Beyond
      </Heading>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Linked
        </Heading>
        <div style={{ maxWidth: "480px" }}>
          <DndBeyondLink
            href="https://www.dndbeyond.com/characters/12345678"
            label="Character Sheet"
          />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Empty state
        </Heading>
        <div style={{ maxWidth: "480px" }}>
          <DndBeyondLink label="Character Sheet" />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Encounter (linked)
        </Heading>
        <div style={{ maxWidth: "480px" }}>
          <DndBeyondLink
            href="https://www.dndbeyond.com/encounters/87654321"
            label="Encounter"
          />
        </div>
      </section>
    </div>
  )
}
