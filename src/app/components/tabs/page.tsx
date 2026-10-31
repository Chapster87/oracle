import Heading from "@components/heading"
import Text from "@components/text"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/tabs"

export default function TabsDemoPage() {
  return (
    <div className="flex flex-col gap-4">
      <Heading level="h2" display="h4">
        Tabs
      </Heading>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lore">Lore</TabsTrigger>
          <TabsTrigger value="secrets">Secrets</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Text>General information about this entity.</Text>
        </TabsContent>
        <TabsContent value="lore">
          <Text>World lore and historical context.</Text>
        </TabsContent>
        <TabsContent value="secrets">
          <Text>DM-only secrets (hidden from players by RBAC).</Text>
        </TabsContent>
      </Tabs>
    </div>
  )
}
