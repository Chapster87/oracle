import Breadcrumb from "@components/breadcrumb"

export default function BreadcrumbDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "20px" }}>
        Breadcrumb
      </h2>
      <p style={{ color: "var(--muted-foreground)", margin: 0 }}>
        The trail is derived from the current pathname. This page renders
        /components/breadcrumb.
      </p>
      <Breadcrumb />
      <p style={{ color: "var(--muted-foreground)", margin: 0 }}>
        With a dynamic segment label:
      </p>
      <Breadcrumb dynamicSegments={{ breadcrumb: "Breadcrumb Demo" }} />
    </div>
  )
}
