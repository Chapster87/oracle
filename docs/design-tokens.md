# Design Tokens

Every token below is defined in `src/styles/variables.css`. Components consume
them through CSS Modules (`var(--token)`); never hard-code the literal value.

Consumers are named at the component or screen level. "Unused" means the token
is defined but nothing currently references it — keep it if it is part of the
intended palette, otherwise it is a candidate for removal.

## Semantic tokens

| Token | Value | Consumers |
| --- | --- | --- |
| `--primary` | `var(--color-blue)` (`#00418e`) | Button (primary), Input/Textarea/Select/Checkbox focus, TagInput/RepeatableTextList focus, Tabs, Breadcrumb, Dialog, DropdownMenu, Link, entity screens, knowledge-base, workbench cards |
| `--primary-foreground` | `var(--color-white)` (`#ffffff`) | Button (primary), Checkbox (checked), knowledge-base active category |
| `--background` | `var(--color-white)` (`#ffffff`) | `body`, app shell, Input/Textarea/Select/Checkbox, knowledge-base, connect dialog |
| `--foreground` | `#020817` | `body`, app shell, Button (outline/ghost), Input/Textarea/Select/Checkbox, Field label, TagInput/RepeatableTextList, Breadcrumb, Dialog, DropdownMenu, entity screens, knowledge-base, story-log, Tabs |
| `--card` | `var(--color-white)` (`#ffffff`) | app shell cards, knowledge-base cards, D&D Beyond, entity-detail, entity-directory, story-log |
| `--card-foreground` | `#020817` | Unused |
| `--popover` | `var(--color-white)` (`#ffffff`) | Select content |
| `--popover-foreground` | `#020817` | Select content |
| `--muted` | `#f1f5f9` | Button (outline/ghost hover), Dialog, DropdownMenu, Select highlighted item, TagInput chip, RepeatableTextList icon hover, app shell nav hover, knowledge-base count/tag, entity screens |
| `--muted-foreground` | `#64748b` | app shell, page subtitles, Breadcrumb, Field help, Input icon, TagInput remove control, RepeatableTextList icons, knowledge-base, dashboard, entity screens |
| `--accent` | `#f1f5f9` | Unused |
| `--accent-foreground` | `#0f172a` | Unused |
| `--destructive` | `#ef4444` | Button (destructive), Input/Textarea/Select/Checkbox invalid, Field error, connect dialog error, delete dialog |
| `--destructive-foreground` | `#f8fafc` | Button (destructive) |
| `--border` | `#e2e8f0` | Button (outline), Input/Textarea/Select/Checkbox, Field, TagInput, RepeatableTextList, Dialog, DropdownMenu, Tabs, Breadcrumb, app shell, knowledge-base, entity screens, story-log |
| `--input` | `#e2e8f0` | Unused |
| `--radius` | `8px` | Input/Textarea/Select, Dialog, DropdownMenu, app shell cards, knowledge-base, D&D Beyond, entity screens, story-log, workbench cards |

## Palette

| Token | Value | Consumers |
| --- | --- | --- |
| `--color-blue` | `#00418e` | `--primary`, `--player-accent`, `--color-info`; app shell nav icons, Button (link), dashboard links, knowledge-base active hover |
| `--color-burgundy` | `#991b1b` | `--dm-accent`; entity-detail DM accents |
| `--color-ddb` | `#e40712` | D&D Beyond card |
| `--color-white` | `#ffffff` | `--background`, `--card`, `--popover`, `--primary-foreground`; Button, Dialog, DropdownMenu, app shell, knowledge-base, dashboard |
| `--color-black` | `#000000` | app shell floating bar label |
| `--color-gold` | `#ffb81c` | `--color-warning` |
| `--color-green` | `#00b140` | Unused |
| `--color-teal-200` | `#319aaf` | Unused |
| `--color-teal-100` | `#65c3cd` | Unused |
| `--color-grey` | `#d0d7f0` | Unused |
| `--color-orange-100` | `#feb757` | Unused |
| `--color-orange-200` | `#fb9235` | Unused |
| `--color-red` | `#f02f0e` | `--color-danger` |
| `--color-green-100` | `#dcfce7` | knowledge-base public badge, entity-detail/entity-directory success badges |
| `--color-green-800` | `#166534` | knowledge-base public badge, entity-detail/entity-directory success badges |
| `--color-red-100` | `#fee2e2` | knowledge-base private badge, entity-detail/entity-directory danger badges |
| `--color-red-50` | `#fff5f5` | app shell DM note card, D&D Beyond, entity-detail |
| `--color-yellow-100` | `#fef3c7` | knowledge-base secret badge, entity-detail/entity-directory warning badges |
| `--color-yellow-800` | `#92400e` | knowledge-base secret badge, entity-detail/entity-directory warning badges |
| `--color-grey-100` | `#f8f9fa` | Unused |
| `--color-grey-200` | `#e9ecef` | knowledge-base category hover |
| `--color-grey-300` | `#dee2e6` | Unused |
| `--color-grey-400` | `#ced4da` | Unused |
| `--color-grey-500` | `#adb5bd` | Unused |
| `--color-grey-600` | `#6c757d` | Unused |
| `--color-grey-700` | `#495057` | Unused |
| `--color-grey-800` | `#343a40` | Button (secondary) |
| `--color-grey-900` | `#222222` | Unused |

## Status

| Token | Value | Consumers |
| --- | --- | --- |
| `--color-success` | `#198754` | Unused |
| `--color-warning` | `var(--color-gold)` | Unused |
| `--color-danger` | `var(--color-red)` | Unused |
| `--color-info` | `var(--color-blue)` | Unused |

## Role

| Token | Value | Consumers |
| --- | --- | --- |
| `--dm-accent` | `var(--color-burgundy)` (`#991b1b`) | Button (dm), app shell DM icon and tools, knowledge-base private badge, entity screens |
| `--player-accent` | `var(--color-blue)` (`#00418e`) | app shell player icon |

## Effects

| Token | Value | Consumers |
| --- | --- | --- |
| `--background-overlay` | `rgba(255, 255, 255, 0.4)` | Unused |
| `--box-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Dialog, DropdownMenu, Select content, D&D Beyond cards |

## Not design tokens

`--radix-select-trigger-width` is injected by Radix Select at runtime to size
the dropdown to its trigger. It is not part of the design system.
