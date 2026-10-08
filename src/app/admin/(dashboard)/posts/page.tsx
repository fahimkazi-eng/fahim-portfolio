import { getPublishedPosts, getAllPosts } from "@/lib/db/queries";
import { CollectionPage } from "@/components/admin/collection-page";
import { PostCard, PostEditor } from "@/components/admin/content-editors";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const [items, publishedCount] = await Promise.all([getAllPosts(), getPublishedPosts()]);

  return (
    <CollectionPage
      eyebrow="Notes"
      title="Posts"
      description={
        publishedCount.length
          ? "Drafts stay here until you mark them published — only published notes appear on the homepage."
          : "No notes yet. Drafts stay hidden until published."
      }
      createLabel="Write a note"
      items={items}
      emptyText="No posts yet."
      renderItem={(item) => <PostCard item={item} />}
      form={
        <Card className="p-6">
          <PostEditor />
        </Card>
      }
    />
  );
}