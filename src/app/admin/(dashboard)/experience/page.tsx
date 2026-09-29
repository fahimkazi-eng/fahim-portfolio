import { getExperiences } from "@/lib/db/queries";
import { CollectionPage } from "@/components/admin/collection-page";
import {
  ExperienceCard,
  ExperienceEditor,
} from "@/components/admin/content-editors";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const items = await getExperiences();

  return (
    <CollectionPage
      eyebrow="Experience"
      title="Roles"
      description="Work history, in the order it should appear on the timeline. Leave a description empty and the public page says so rather than filling it with generic copy."
      createLabel="Add a role"
      items={items}
      emptyText="No roles yet. Add the ones that belong on the timeline."
      renderItem={(item) => <ExperienceCard item={item} />}
      form={
        <Card className="p-6">
          <ExperienceEditor />
        </Card>
      }
    />
  );
}
