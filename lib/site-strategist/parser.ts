export type ParsedHeading = {
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  text: string;
};

export type ParsedMetaTag = {
  key: string;
  value: string;
};

export type SiteStrategistAnalysis = {
  normalizedUrl: string;
  headings: ParsedHeading[];
  metaTags: ParsedMetaTag[];
  cta: {
    present: boolean;
    matches: string[];
  };
  valueProposition: {
    text: string | null;
    source: "meta_description" | "og_description" | "h1" | "paragraph" | "none";
  };
};

const CTA_PATTERN = /\b(get started|book|schedule|start|try|demo|join|subscribe|buy now|contact|talk to sales|request|learn more|sign up|free trial)\b/gi;

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]*>/g, " "));
}

function extractHeadings(html: string): ParsedHeading[] {
  const matches = html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi);
  const headings: ParsedHeading[] = [];

  for (const match of matches) {
    const level = match[1]?.toLowerCase() as ParsedHeading["level"];
    const text = stripTags(match[2] ?? "");
    if (text) {
      headings.push({ level, text });
    }
  }

  return headings;
}

function extractMetaTags(html: string): ParsedMetaTag[] {
  const matches = html.matchAll(/<meta\b[^>]*>/gi);
  const metaTags: ParsedMetaTag[] = [];

  for (const [tag] of matches) {
    const contentMatch =
      tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i) ??
      tag.match(/\bcontent\s*=\s*([^\s>]+)/i);

    if (!contentMatch?.[1]) continue;

    const nameMatch =
      tag.match(/\bname\s*=\s*["']([^"']*)["']/i) ??
      tag.match(/\bproperty\s*=\s*["']([^"']*)["']/i);

    if (!nameMatch?.[1]) continue;

    const key = nameMatch[1].trim().toLowerCase();
    const value = decodeHtmlEntities(contentMatch[1]);

    if (key && value) {
      metaTags.push({ key, value });
    }
  }

  return metaTags;
}

function extractBodyText(html: string): string {
  const withoutScripts = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");

  return stripTags(withoutScripts);
}

function extractValueProposition(metaTags: ParsedMetaTag[], headings: ParsedHeading[], html: string): SiteStrategistAnalysis["valueProposition"] {
  const metaDescription = metaTags.find((tag) => tag.key === "description")?.value;
  if (metaDescription) {
    return { text: metaDescription, source: "meta_description" };
  }

  const ogDescription = metaTags.find((tag) => tag.key === "og:description")?.value;
  if (ogDescription) {
    return { text: ogDescription, source: "og_description" };
  }

  const h1 = headings.find((heading) => heading.level === "h1")?.text;
  if (h1) {
    return { text: h1, source: "h1" };
  }

  const paragraphMatch = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const paragraph = paragraphMatch ? stripTags(paragraphMatch[1]) : "";
  if (paragraph) {
    return { text: paragraph, source: "paragraph" };
  }

  return { text: null, source: "none" };
}

export function parseSiteHtml(html: string, normalizedUrl: string): SiteStrategistAnalysis {
  const headings = extractHeadings(html);
  const metaTags = extractMetaTags(html);
  const bodyText = extractBodyText(html).toLowerCase();

  const ctaMatches = Array.from(
    new Set((bodyText.match(CTA_PATTERN) ?? []).map((match) => match.trim().toLowerCase()))
  );

  return {
    normalizedUrl,
    headings,
    metaTags,
    cta: {
      present: ctaMatches.length > 0,
      matches: ctaMatches,
    },
    valueProposition: extractValueProposition(metaTags, headings, html),
  };
}
