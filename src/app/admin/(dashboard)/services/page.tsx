import { getServices } from "@/lib/db/queries";
import { CollectionPage } from "@/components/admin/collection-page";
import { ServiceCard, ServiceEditor } from "@/components/admin/content-editors";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const items = await getServices();

  return (
    <CollectionPage
      eyebrow="Services"
      title="What I build"
      description="The three cards under “What I build” on the homepage, in order. Each card lists concrete deliverables rather than adjectives."
      createLabel="Add a service"
      items={items}
      emptyText="No services yet."
      renderItem={(item) => <ServiceCard item={item} />}
      form={
        <Card className="p-6">
          <ServiceEditor />
        </Card>
      }
    />
  );
}
