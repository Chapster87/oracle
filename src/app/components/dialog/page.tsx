import Button from "@components/button"
import Heading from "@components/heading"
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@components/dialog"

export default function DialogDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Dialog
      </Heading>

      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent>
              <DialogClose asChild>
                <Button unstyled>✕</Button>
              </DialogClose>
              <DialogTitle>New Episode</DialogTitle>
              <DialogDescription>
                Add a new episode to the active campaign.
              </DialogDescription>
              <form
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  marginTop: "16px",
                }}
              >
                <input
                  placeholder="Episode title"
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                  }}
                />
                <textarea
                  placeholder="Summary"
                  rows={3}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                  }}
                >
                  <DialogClose asChild>
                    <Button variant="outline" size="small">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button size="small">Save</Button>
                </div>
              </form>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
    </div>
  )
}
