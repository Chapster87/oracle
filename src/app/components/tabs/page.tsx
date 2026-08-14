import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/tabs"

export default function TabsDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "20px" }}>Tabs</h2>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lore">Lore</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p>General information about this entity.</p>
        </TabsContent>
        <TabsContent value="lore">
          <p>World lore and historical context.</p>
        </TabsContent>
        <TabsContent value="secrets">
          <p>DM-only secrets (hidden from players by RBAC).</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
