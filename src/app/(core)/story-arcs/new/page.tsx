export const metadata = { title: "New Story Arc" }

import EntityFormPage from "@/components/entity-form/entity-form-page"

export default function NewStoryArcPage() {
  return <EntityFormPage type="story_arcs" mode="create" />
}
