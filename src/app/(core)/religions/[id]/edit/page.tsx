import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditReligionPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="religions" mode="edit" id={id} />
}
