// components/ChatBubble.tsx

export default function ChatBubble({
  role,
  content
}: {
  role: string;
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div
        className={`px-4 py-3 rounded-2xl max-w-[75%] whitespace-pre-wrap shadow-md
        ${isUser
          ? "bg-brandBlue text-white border border-brandBlueLight"
          : "bg-brandNavy text-brandBlueLight border border-brandBlue"}
        `}
      >
        {content}
      </div>
    </div>
  );
}
