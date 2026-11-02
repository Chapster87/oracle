import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditFactionPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="factions" mode="edit" id={id} />
}
