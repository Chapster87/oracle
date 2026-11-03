export const metadata = { title: "Edit Story Arc" }

import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditStoryArcPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="story_arcs" mode="edit" id={id} />
}
