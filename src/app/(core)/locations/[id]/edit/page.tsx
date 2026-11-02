import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditLocationPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="locations" mode="edit" id={id} />
}
