"use client"

import Heading from "@components/heading"
import Link from "@components/link"

export default function LinkDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Link
      </Heading>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Text link
        </Heading>
        <Link href="/components">Back to the workbench</Link>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Button style
        </Heading>
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
        <Heading level="h3" display="h6">
          Sizes
        </Heading>
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
