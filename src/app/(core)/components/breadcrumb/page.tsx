export const metadata = { title: "Breadcrumb" }

import Breadcrumb from "@components/breadcrumb"
import Heading from "@components/heading"
import Text from "@components/text"

export default function BreadcrumbDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Breadcrumb
      </Heading>
      <Text style={{ color: "var(--muted-foreground)", margin: 0 }}>
        The trail is derived from the current pathname. This page renders
        /components/breadcrumb.
      </Text>
      <Breadcrumb />
      <Text style={{ color: "var(--muted-foreground)", margin: 0 }}>
        With a dynamic segment label:
      </Text>
      <Breadcrumb dynamicSegments={{ breadcrumb: "Breadcrumb Demo" }} />
    </div>
  )
}
