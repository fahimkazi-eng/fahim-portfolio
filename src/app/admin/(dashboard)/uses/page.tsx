import { getUsesItems } from "@/lib/db/queries";
import { CollectionPage } from "@/components/admin/collection-page";
import { UsesItemCard, UsesItemEditor } from "@/components/admin/content-editors";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminUsesPage() {
  const items = await getUsesItems();
  const categories = [...new Set(items.map((s) => s.category))];

  return (
    <CollectionPage
      eyebrow="Uses"
      title="What I use"
      description={
        categories.length
          ? `Grouped by ${categories.join(", ").toLowerCase()}. The note is optional — leave it empty rather than inventing one.`
          : "Grouped by category. The note is optional — leave it empty rather than inventing one."
      }
      createLabel="Add an item"
      items={items}
      emptyText="No items yet."
      renderItem={(item) => <UsesItemCard item={item} />}
      form={
        <Card className="p-6">
          <UsesItemEditor />
        </Card>
      }
    />
  );
}