export const metadata = { title: "New Character" }

import EntityFormPage from "@/components/entity-form/entity-form-page"

export default function NewCharacterPage() {
  return <EntityFormPage type="characters" mode="create" />
}
