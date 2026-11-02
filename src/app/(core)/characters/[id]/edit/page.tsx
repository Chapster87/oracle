export const metadata = { title: "Edit Character" }

import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCharacterPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="characters" mode="edit" id={id} />
}
