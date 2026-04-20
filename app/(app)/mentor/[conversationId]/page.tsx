import { redirect } from "next/navigation";

export default function MentorConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  redirect(`/mentor?conversation=${params.conversationId}`);
}
