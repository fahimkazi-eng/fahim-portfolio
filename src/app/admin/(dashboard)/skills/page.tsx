import { getSkills } from "@/lib/db/queries";
import { CollectionPage } from "@/components/admin/collection-page";
import { SkillCard, SkillEditor } from "@/components/admin/content-editors";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const items = await getSkills();
  const categories = [...new Set(items.map((s) => s.category))];

  return (
    <CollectionPage
      eyebrow="Skills"
      title="Capabilities"
      description={
        categories.length
          ? `Grouped by ${categories.join(", ").toLowerCase()}. The level meter is optional — leave it empty and the row shows a dash rather than an invented score.`
          : "Grouped by category. The level meter is optional — leave it empty and the row shows a dash rather than an invented score."
      }
      createLabel="Add a skill"
      items={items}
      emptyText="No skills yet."
      renderItem={(item) => <SkillCard item={item} />}
      form={
        <Card className="p-6">
          <SkillEditor />
        </Card>
      }
    />
  );
}
