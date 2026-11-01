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
  {
    name: "Search Select",
    href: "/components/search-select",
    description: "Searchable single-select for any option list",
  },
]

const tokens = [
  { name: "--primary", description: "Primary actions and focus rings" },
  { name: "--foreground", description: "Default text" },
  { name: "--muted-foreground", description: "Secondary text" },
  { name: "--background", description: "Page background" },
  { name: "--card", description: "Card surfaces" },
  { name: "--muted", description: "Subtle fills" },
  { name: "--border", description: "Borders and dividers" },
  { name: "--destructive", description: "Errors and destructive actions" },
  { name: "--dm-accent", description: "DM-only accents" },
  { name: "--player-accent", description: "Player accents" },
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

      <section className={s.tokens}>
        <Heading level="h3" display="h5">
          Design tokens
        </Heading>
        <Text size="sm" className={s.tokensIntro}>
          Every component consumes these tokens. See docs/design-tokens.md for
          the full list.
        </Text>
        <div className={s.tokenGrid}>
          {tokens.map((token) => (
            <div key={token.name} className={s.token}>
              <span
                className={s.swatch}
                style={{ background: `var(${token.name})` }}
              />
              <div>
                <div className={s.tokenName}>{token.name}</div>
                <Text size="sm" className={s.tokenDescription}>
                  {token.description}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
