import { ToolPlaceholderPage } from "../_components/tool-placeholder-page";

export default function SeoUxPage() {
  return (
    <ToolPlaceholderPage
      title="SEO / UX"
      description="Score discoverability and user experience signals so your site is easier to find, understand, and act on."
      inputLabel="URL or page notes"
      inputPlaceholder="Paste a URL or list the page details you want scored for SEO and UX."
      resultTitle="SEO / UX scoring preview"
      resultDescription="This area will show the priority score, search friction, experience friction, and focused fixes."
    />
  );
}
