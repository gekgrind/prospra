import { ToolPlaceholderPage } from "../_components/tool-placeholder-page";

export default function WebsiteCoachPage() {
  return (
    <ToolPlaceholderPage
      title="Website Coach"
      description="Review the structure, clarity, and strategic strength of a website page before deciding what to improve next."
      inputLabel="Page or website URL"
      inputPlaceholder="Paste the page URL or describe the page you want Prospra to coach."
      resultTitle="Coaching snapshot"
      resultDescription="This area will summarize the strongest signal, the main friction point, and the next improvement to make."
    />
  );
}
