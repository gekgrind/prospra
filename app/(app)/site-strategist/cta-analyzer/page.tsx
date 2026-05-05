import { ToolPlaceholderPage } from "../_components/tool-placeholder-page";

export default function CtaAnalyzerPage() {
  return (
    <ToolPlaceholderPage
      title="CTA Analyzer"
      description="Evaluate calls to action for clarity, urgency, intent match, and conversion strength."
      inputLabel="CTA copy"
      inputPlaceholder="Paste the CTA, surrounding section copy, and the action you want visitors to take."
      resultTitle="CTA analysis preview"
      resultDescription="This area will identify the intent gap, friction in the ask, and a stronger CTA direction."
    />
  );
}
