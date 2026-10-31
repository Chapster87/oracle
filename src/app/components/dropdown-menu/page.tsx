import Button from "@components/button"
import Heading from "@components/heading"
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
      <Heading level="h2" display="h4">
        Dropdown Menu
      </Heading>

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
