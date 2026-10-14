import Link from "next/link"
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
]

export default function ComponentsPage() {
  return (
    <div className={s.container}>
      <h2
        style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "24px" }}
      >
        Component Workbench
      </h2>

      <div className={s.grid}>
        {demos.map((demo) => (
          <Link key={demo.name} href={demo.href} className={s.card}>
            <div className={s.cardTitle}>{demo.name}</div>
            <p className={s.description}>{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
