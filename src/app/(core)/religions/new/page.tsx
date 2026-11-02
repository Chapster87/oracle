export const metadata = { title: "New Religion" }

import EntityFormPage from "@/components/entity-form/entity-form-page"

export default function NewReligionPage() {
  return <EntityFormPage type="religions" mode="create" />
}
