import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"
import s from "./style.module.css"

const demos = [
  {
    name: "Tabs",
    href: "/components/tabs",
    description: "Radix Tabs wrapper demo",
  },
  {
    name: "Dialog",
    href: "/components/dialog",
    description: "Radix Dialog wrapper demo",
  },
  {
    name: "Dropdown Menu",
    href: "/components/dropdown-menu",
    description: "Radix DropdownMenu wrapper demo",
  },
  {
    name: "D&D Beyond",
    href: "/components/dnd-beyond",
    description: "Link-first integration card (linked + empty states)",
  },
  {
    name: "Link",
    href: "/components/link",
    description: "next/link wrapper with optional button styling",
  },
  {
    name: "Breadcrumb",
    href: "/components/breadcrumb",
    description: "Pathname-derived breadcrumb trail",
  },
  {
    name: "Typography",
    href: "/components/typography",
    description: "Heading and Text components with the global scale",
  },
  {
    name: "Form Controls",
    href: "/components/form-controls",
    description: "Field, Input, Textarea, Select, and Checkbox",
  },
]

export default function ComponentsPage() {
  return (
    <div className={s.container}>
      <Heading level="h2" display="h3" style={{ marginBottom: "24px" }}>
        Component Workbench
      </Heading>

      <div className={s.grid}>
        {demos.map((demo) => (
          <Link key={demo.name} href={demo.href} className={s.card}>
            <div className={s.cardTitle}>{demo.name}</div>
            <Text size="sm" className={s.description}>
              {demo.description}
            </Text>
          </Link>
        ))}
      </div>
    </div>
  )
}
