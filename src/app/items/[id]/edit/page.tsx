import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditItemPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="items" mode="edit" id={id} />
}
