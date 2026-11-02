export const metadata = { title: "Typography" }

import Heading from "@components/heading"
import Text from "@components/text"

export default function TypographyDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Typography
      </Heading>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Heading levels
        </Heading>
        <Heading level="h1">Heading 1</Heading>
        <Heading level="h2">Heading 2</Heading>
        <Heading level="h3">Heading 3</Heading>
        <Heading level="h4">Heading 4</Heading>
        <Heading level="h5">Heading 5</Heading>
        <Heading level="h6">Heading 6</Heading>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Display size independent of level
        </Heading>
        <Heading level="h2" display="h1">
          An h2 rendered at h1 size
        </Heading>
        <Heading level="h3" display="h5">
          An h3 rendered at h5 size
        </Heading>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Text sizes
        </Heading>
        <Text size="sm">Small text (14px).</Text>
        <Text size="default">Default text (16px).</Text>
        <Text size="lg">Large text (18px).</Text>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Heading level="h3" display="h6">
          Text variants
        </Heading>
        <Text variant="p">A paragraph.</Text>
        <Text variant="span">A span.</Text>
        <Text variant="div">A div.</Text>
      </section>
    </div>
  )
}
