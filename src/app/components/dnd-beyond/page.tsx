import DndBeyondLink from "@components/dnd-beyond"

export default function DndBeyondDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "20px" }}>
        D&D Beyond
      </h2>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>Linked</h3>
        <div style={{ maxWidth: "480px" }}>
          <DndBeyondLink
            href="https://www.dndbeyond.com/characters/12345678"
            label="Character Sheet"
          />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>
          Empty state
        </h3>
        <div style={{ maxWidth: "480px" }}>
          <DndBeyondLink label="Character Sheet" />
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>
          Encounter (linked)
        </h3>
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
