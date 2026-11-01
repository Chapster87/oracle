import EntityFormPage from "@/components/entity-form/entity-form-page"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPlayerPage({ params }: PageProps) {
  const { id } = await params
  return <EntityFormPage type="players" mode="edit" id={id} />
}
