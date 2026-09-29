import { getEducations } from "@/lib/db/queries";
import { CollectionPage } from "@/components/admin/collection-page";
import {
  EducationCard,
  EducationEditor,
} from "@/components/admin/content-editors";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminEducationPage() {
  const items = await getEducations();

  return (
    <CollectionPage
      eyebrow="Education"
      title="Study"
      description="Degrees and institutions. Tick “currently studying” and the public timeline collapses the end date to “Present” instead of leaving a stale year."
      createLabel="Add an entry"
      items={items}
      emptyText="No education entries yet."
      renderItem={(item) => <EducationCard item={item} />}
      form={
        <Card className="p-6">
          <EducationEditor />
        </Card>
      }
    />
  );
}
