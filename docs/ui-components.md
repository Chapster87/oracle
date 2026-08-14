# UI Component Wrappers

Global wrappers around Radix UI primitives that apply the Oracle design system (CSS Modules + global tokens) consistently across the app.

## Conventions

- Wrappers live flat in `src/components/<primitive>/`, mirroring the `Button` pattern: `index.tsx` + `styles.module.css`.
- Every wrapper file starts with `"use client"` (Radix primitives are interactive).
- Styled parts accept and merge a `className`; plain pass-throughs (Root, Trigger, Portal) forward all props untouched.
- Styling uses CSS Modules with the `s` import alias and tokens from `src/styles/variables.css` (`--primary`, `--border`, `--muted`, `--radius`, `--box-shadow`, ...).
- Use the global `Button` component (`@components/button`) for all buttons, including Radix `asChild` children (triggers, close buttons, dialog actions).

## Tabs

Parts: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`. Style: underline with a primary-colored active indicator. Used for the 'Layered Detail' entity views (Research #10).

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/tabs"

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="lore">Lore</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">{/* ... */}</TabsContent>
  <TabsContent value="lore">{/* ... */}</TabsContent>
</Tabs>
```

## Dialog

Parts: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`. This is the global modal — use it for all overlays and dialogs (the rules' "Modal" references map here).

Follow the `schema-modal` pattern: form container `display: flex; flex-direction: column; gap: 16px`, actions container right-aligned with `gap: 12px`, and the `Button` component for every action.

```tsx
import Button from "@components/button"
import {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent,
  DialogTitle, DialogDescription, DialogClose,
} from "@components/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogClose asChild>
        <Button unstyled>✕</Button>
      </DialogClose>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
      <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* fields */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Save</Button>
        </div>
      </form>
    </DialogContent>
  </DialogPortal>
</Dialog>
```

## Dropdown Menu

Parts: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuPortal`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`.

```tsx
import Button from "@components/button"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@components/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuPortal>
    <DropdownMenuContent sideOffset={8} align="start">
      <DropdownMenuLabel>Campaign</DropdownMenuLabel>
      <DropdownMenuItem>Edit Details</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Archive</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuPortal>
</DropdownMenu>
```

## Workbench

Live demos: `/components` (dashboard) with per-component pages at `/components/<primitive>`. Dev-only — not linked from the nav; accessed directly; to be suppressed from the live build. Add `src/app/components/<primitive>/page.tsx` when wrapping a new primitive.

## Adding a wrapper

1. Install the primitive: `npm i @radix-ui/react-<primitive>`.
2. Create `src/components/<primitive>/index.tsx` with `"use client"`, `* as XxxPrimitive` import, `s` import, named exports for each part, `className` merged on styled parts.
3. Create `src/components/<primitive>/styles.module.css` using global tokens and the 8px grid.
4. Add a demo page at `src/app/components/<primitive>/page.tsx` and link it from `/components`.
