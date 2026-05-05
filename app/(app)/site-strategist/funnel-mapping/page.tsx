import { ToolPlaceholderPage } from "../_components/tool-placeholder-page";

export default function FunnelMappingPage() {
  return (
    <ToolPlaceholderPage
      title="Funnel Mapping"
      description="Map the path from first impression to conversion and identify where visitor momentum weakens."
      inputLabel="Funnel details"
      inputPlaceholder="Describe the traffic source, landing page, offer, CTA, and next step."
      resultTitle="Funnel map preview"
      resultDescription="This area will outline the current path, missing trust points, conversion leaks, and next move."
    />
  );
}
