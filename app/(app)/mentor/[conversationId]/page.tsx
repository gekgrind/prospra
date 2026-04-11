import { redirect } from "next/navigation";

export default async function MentorConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  redirect(`/mentor?conversation=${conversationId}`);
}
