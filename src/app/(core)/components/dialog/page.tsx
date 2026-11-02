export const metadata = { title: "Dialog" }

import Button from "@components/button"
import Heading from "@components/heading"
import Field from "@components/field"
import Input from "@components/input"
import Textarea from "@components/textarea"
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
                <Field label="Episode title">
                  <Input placeholder="Episode title" />
                </Field>
                <Field label="Summary">
                  <Textarea placeholder="Summary" rows={3} />
                </Field>
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
