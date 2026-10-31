"use client"

import Link from "@components/link"

export default function LinkDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "20px" }}>Link</h2>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>
          Text link
        </h3>
        <Link href="/components">Back to the workbench</Link>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>
          Button style
        </h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            variant="primary"
          >
            Primary
          </Link>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            variant="secondary"
          >
            Secondary
          </Link>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            variant="outline"
          >
            Outline
          </Link>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            variant="ghost"
          >
            Ghost
          </Link>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            variant="destructive"
          >
            Destructive
          </Link>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontWeight: 600, margin: 0, fontSize: "14px" }}>Sizes</h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            size="small"
          >
            Small
          </Link>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            size="default"
          >
            Default
          </Link>
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            buttonStyle
            size="large"
          >
            Large
          </Link>
        </div>
      </section>
    </div>
  )
}
