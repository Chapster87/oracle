import Button from "@components/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@components/dropdown-menu"

export default function DropdownMenuDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "20px" }}>
        Dropdown Menu
      </h2>

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent sideOffset={8} align="start">
              <DropdownMenuLabel>Campaign</DropdownMenuLabel>
              <DropdownMenuItem>Edit Details</DropdownMenuItem>
              <DropdownMenuItem>New Episode</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive Campaign</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </div>
  )
}
