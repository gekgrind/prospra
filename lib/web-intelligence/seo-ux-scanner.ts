import { lookup } from "node:dns/promises";
import net from "node:net";

import {
  runFallbackSeoUxAnalysis,
  type SeoUxAnalysisInput,
  type SeoUxAnalysisResult,
  type SeoUxFix,
} from "@/lib/web-intelligence/seo-ux-analyzer";

const MAX_HTML_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 10_000;
const PAGESPEED_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const USER_AGENT =
  "ProspraSeoUxAnalyzer/1.0 (+https://prospra.entrepreneuria.io)";
const CTA_PATTERN =
  /\b(get started|book|schedule|start|try|demo|join|subscribe|buy|contact|talk to sales|request|learn more|sign up|free trial|apply|download)\b/gi;

type ExtractedHeading = {
  level: 1 | 2 | 3;
  text: string;
};

type ExtractedLink = {
  href: string;
  text: string;
};

type ExtractedHtmlSignals = {
  normalizedUrl: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robotsMeta: string | null;
  viewportMeta: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  headings: ExtractedHeading[];
  imageCount: number;
  imagesWithAltCount: number;
  linkCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  bodyText: string;
  bodyTextSample: string;
  wordCount: number;
  keyword: {
    inTitle: boolean;
    inMeta: boolean;
    inHeadings: boolean;
    inBody: boolean;
    bodyOccurrences: number;
  };
  ctaTexts: string[];
  formCount: number;
  buttonTexts: string[];
  landmarkCount: number;
  hasMain: boolean;
  hasNav: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
  formControlCount: number;
  labeledControlCount: number;
  headingOrderIssues: string[];
};

type PageSpeedResult = {
  status: "connected" | "not-configured" | "unavailable";
  summary: string;
  data: PageSpeedData | null;
};

type PageSpeedStrategy = "mobile" | "desktop";

type PageSpeedMetric = {
  numericValue: number | null;
  displayValue: string | null;
  score: number | null;
};

type PageSpeedStrategyResult = {
  strategy: PageSpeedStrategy;
  performanceScore: number | null;
  fcp: PageSpeedMetric;
  lcp: PageSpeedMetric;
  tbt: PageSpeedMetric;
  cls: PageSpeedMetric;
  speedIndex: PageSpeedMetric;
};

type PageSpeedData = {
  mobile: PageSpeedStrategyResult | null;
  desktop: PageSpeedStrategyResult | null;
  averagePerformanceScore: number | null;
  feedback: string[];
};

type PageSpeedApiResponse = {
  lighthouseResult?: {
    categories?: {
      performance?: {
        score?: number;
      };
    };
    audits?: Record<
      string,
      {
        numericValue?: number;
        displayValue?: string;
        score?: number | null;
      }
    >;
  };
};

export function normalizeSeoUxUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("A page URL is required.");
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Only http and https URLs are supported.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not supported.");
  }

  parsed.hash = "";
  return parsed.toString();
}

export async function analyzeSeoUxPage(
  input: SeoUxAnalysisInput
): Promise<SeoUxAnalysisResult> {
  const normalizedUrl = normalizeSeoUxUrl(input.url);
  const primaryKeyword = input.primaryKeyword.trim();

  if (!primaryKeyword) {
    throw new Error("A primary keyword is required.");
  }

  try {
    const fetched = await fetchHtmlWithSafety(normalizedUrl);
    const signals = extractHtmlSignals(
      fetched.html,
      normalizedUrl,
      fetched.finalUrl,
      primaryKeyword
    );
    const pageSpeed = await getPageSpeedResult(fetched.finalUrl);

    return mapSignalsToResult(input, signals, pageSpeed);
  } catch (error) {
    if (isValidationError(error)) {
      throw error;
    }

    console.error("SEO/UX scanner fell back to typed fallback analysis:", error);
    const fallback = await runFallbackSeoUxAnalysis({
      ...input,
      url: normalizedUrl,
      primaryKeyword,
    });

    return {
      ...fallback,
      pageSpeedPlaceholder:
        "Live page scanning was unavailable for this URL, so this fallback analysis did not run PageSpeed. Try again later or test another public page.",
    };
  }
}

async function fetchHtmlWithSafety(
  startingUrl: string
): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = startingUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicHttpTarget(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (isRedirect(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error("The page redirected without a destination.");
        }

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`The page returned HTTP ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("text/html")) {
        throw new Error("The URL did not return HTML content.");
      }

      const html = await readLimitedResponse(response);
      if (!html || html.trim().length < 40) {
        throw new Error("The page returned empty or unreadable HTML.");
      }

      return { html, finalUrl: currentUrl };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("The page redirected too many times.");
}

async function assertPublicHttpTarget(rawUrl: string) {
  const parsed = new URL(rawUrl);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("Local or private network URLs are not supported.");
  }

  const directIp = net.isIP(hostname) ? [hostname] : [];
  const records =
    directIp.length > 0
      ? directIp
      : (await lookup(hostname, { all: true })).map((entry) => entry.address);

  if (records.length === 0 || records.some(isPrivateAddress)) {
    throw new Error("Local or private network URLs are not supported.");
  }
}

async function readLimitedResponse(response: Response) {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (value) {
      received += value.byteLength;
      if (received > MAX_HTML_BYTES) {
        throw new Error("The page HTML is too large to scan safely.");
      }
      chunks.push(value);
    }
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

function extractHtmlSignals(
  html: string,
  normalizedUrl: string,
  finalUrl: string,
  primaryKeyword: string
): ExtractedHtmlSignals {
  const cleanedHtml = html || "";
  const bodyText = stripHtml(cleanedHtml);
  const headings = extractHeadings(cleanedHtml);
  const imageTags = cleanedHtml.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAltCount = imageTags.filter((tag) =>
    /\balt\s*=\s*["'][^"']+["']/i.test(tag)
  ).length;
  const links = extractLinks(cleanedHtml);
  const baseHost = new URL(finalUrl).hostname;
  const internalLinkCount = links.filter((link) =>
    isInternalLink(link.href, finalUrl, baseHost)
  ).length;
  const externalLinkCount = links.length - internalLinkCount;
  const buttonTexts = extractButtonTexts(cleanedHtml);
  const ctaTexts = Array.from(
    new Set([
      ...buttonTexts,
      ...links.map((link) => link.text),
      ...(bodyText.match(CTA_PATTERN) ?? []),
    ])
  )
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, 10);
  const formControls = extractFormControls(cleanedHtml);
  const keywordText = primaryKeyword.toLowerCase();

  return {
    normalizedUrl,
    finalUrl,
    title: extractTitle(cleanedHtml),
    metaDescription: extractMetaContent(cleanedHtml, "description", "name"),
    canonicalUrl: extractLinkHref(cleanedHtml, "canonical"),
    robotsMeta: extractMetaContent(cleanedHtml, "robots", "name"),
    viewportMeta: extractMetaContent(cleanedHtml, "viewport", "name"),
    ogTitle: extractMetaContent(cleanedHtml, "og:title", "property"),
    ogDescription: extractMetaContent(cleanedHtml, "og:description", "property"),
    headings,
    imageCount: imageTags.length,
    imagesWithAltCount,
    linkCount: links.length,
    internalLinkCount,
    externalLinkCount,
    bodyText,
    bodyTextSample: bodyText.slice(0, 700),
    wordCount: countWords(bodyText),
    keyword: {
      inTitle: includesKeyword(extractTitle(cleanedHtml), keywordText),
      inMeta: includesKeyword(
        extractMetaContent(cleanedHtml, "description", "name"),
        keywordText
      ),
      inHeadings: includesKeyword(
        headings.map((heading) => heading.text).join(" "),
        keywordText
      ),
      inBody: includesKeyword(bodyText, keywordText),
      bodyOccurrences: countKeywordOccurrences(bodyText, keywordText),
    },
    ctaTexts,
    formCount: (cleanedHtml.match(/<form\b[^>]*>/gi) ?? []).length,
    buttonTexts,
    landmarkCount: countLandmarks(cleanedHtml),
    hasMain: /<main\b[^>]*>/i.test(cleanedHtml),
    hasNav: /<nav\b[^>]*>/i.test(cleanedHtml),
    hasHeader: /<header\b[^>]*>/i.test(cleanedHtml),
    hasFooter: /<footer\b[^>]*>/i.test(cleanedHtml),
    formControlCount: formControls.total,
    labeledControlCount: formControls.labeled,
    headingOrderIssues: getHeadingOrderIssues(headings),
  };
}

async function getPageSpeedResult(url: string): Promise<PageSpeedResult> {
  const pageSpeedData = await fetchPageSpeedData(url);

  if (pageSpeedData.status !== "connected") {
    return pageSpeedData;
  }

  return {
    status: "connected",
    data: pageSpeedData.data,
    summary: buildPageSpeedSummary(pageSpeedData.data),
  };
}

async function fetchPageSpeedData(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    return {
      status: "not-configured",
      data: null,
      summary:
        "PageSpeed is not connected yet. Add GOOGLE_PAGESPEED_API_KEY to enable Core Web Vitals and Lighthouse performance checks.",
    };
  }

  try {
    const [mobile, desktop] = await Promise.all([
      fetchPageSpeedStrategy(url, "mobile", apiKey),
      fetchPageSpeedStrategy(url, "desktop", apiKey),
    ]);
    const scores = [mobile.performanceScore, desktop.performanceScore].filter(
      isNumber
    );
    const averagePerformanceScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((total, score) => total + score, 0) / scores.length
          )
        : null;
    const data: PageSpeedData = {
      mobile,
      desktop,
      averagePerformanceScore,
      feedback: buildPageSpeedFeedback([mobile, desktop]),
    };

    return {
      status: "connected",
      data,
      summary: buildPageSpeedSummary(data),
    };
  } catch (error) {
    console.error("SEO/UX PageSpeed check unavailable:", error);
    return {
      status: "unavailable",
      data: null,
      summary:
        "PageSpeed is configured but unavailable right now, so the analysis continues with content, SEO, UX, and accessibility signals only.",
    };
  }
}

async function fetchPageSpeedStrategy(
  url: string,
  strategy: PageSpeedStrategy,
  apiKey: string
): Promise<PageSpeedStrategyResult> {
  const endpoint = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("category", "performance");
  endpoint.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`PageSpeed ${strategy} returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as PageSpeedApiResponse;
    return normalizePageSpeedResult(strategy, payload);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePageSpeedResult(
  strategy: PageSpeedStrategy,
  payload: PageSpeedApiResponse
): PageSpeedStrategyResult {
  const audits = payload.lighthouseResult?.audits ?? {};
  const performanceScore = payload.lighthouseResult?.categories?.performance
    ?.score;

  return {
    strategy,
    performanceScore:
      typeof performanceScore === "number"
        ? Math.round(performanceScore * 100)
        : null,
    fcp: normalizePageSpeedMetric(audits["first-contentful-paint"]),
    lcp: normalizePageSpeedMetric(audits["largest-contentful-paint"]),
    tbt: normalizePageSpeedMetric(audits["total-blocking-time"]),
    cls: normalizePageSpeedMetric(audits["cumulative-layout-shift"]),
    speedIndex: normalizePageSpeedMetric(audits["speed-index"]),
  };
}

function normalizePageSpeedMetric(
  audit:
    | {
        numericValue?: number;
        displayValue?: string;
        score?: number | null;
      }
    | undefined
): PageSpeedMetric {
  return {
    numericValue: typeof audit?.numericValue === "number" ? audit.numericValue : null,
    displayValue: audit?.displayValue ?? null,
    score: typeof audit?.score === "number" ? audit.score : null,
  };
}

function mapSignalsToResult(
  input: SeoUxAnalysisInput,
  signals: ExtractedHtmlSignals,
  pageSpeed: PageSpeedResult
): SeoUxAnalysisResult {
  const audienceOffer = input.audienceOffer?.trim() || null;
  const seoScore = scoreSeo(signals, pageSpeed);
  const uxScore = scoreUx(signals, pageSpeed);

  return {
    analyzedUrl: signals.finalUrl,
    primaryKeyword: input.primaryKeyword.trim(),
    audienceOffer,
    seoScore,
    uxScore,
    titleMetaFeedback: buildTitleMetaFeedback(signals),
    headingStructureFeedback: buildHeadingFeedback(signals),
    keywordAlignment: buildKeywordFeedback(signals),
    mobileReadabilityNotes: buildReadabilityFeedback(signals),
    pageSpeedPlaceholder: pageSpeed.summary,
    accessibilityNotes: buildAccessibilityFeedback(signals),
    prioritizedFixes: buildPrioritizedFixes(signals, seoScore, uxScore, pageSpeed),
  };
}

function scoreSeo(signals: ExtractedHtmlSignals, pageSpeed: PageSpeedResult) {
  const contentScore = clampScore(
    (signals.title ? 16 : 0) +
      (signals.title && signals.title.length >= 25 && signals.title.length <= 65 ? 8 : 0) +
      (signals.metaDescription ? 16 : 0) +
      (signals.metaDescription &&
      signals.metaDescription.length >= 80 &&
      signals.metaDescription.length <= 170
        ? 8
        : 0) +
      (signals.canonicalUrl ? 10 : 0) +
      (signals.viewportMeta ? 8 : 0) +
      (signals.ogTitle ? 7 : 0) +
      (signals.ogDescription ? 7 : 0) +
      (signals.headings.filter((heading) => heading.level === 1).length === 1 ? 10 : 0) +
      (signals.keyword.inTitle ? 5 : 0) +
      (signals.keyword.inMeta ? 3 : 0) +
      (signals.keyword.inHeadings ? 2 : 0)
  );
  const performanceScore = pageSpeed.data?.averagePerformanceScore;

  if (typeof performanceScore !== "number") {
    return contentScore;
  }

  return clampScore(contentScore * 0.85 + performanceScore * 0.15);
}

function scoreUx(signals: ExtractedHtmlSignals, pageSpeed: PageSpeedResult) {
  const altCoverage =
    signals.imageCount === 0 ? 10 : Math.round((signals.imagesWithAltCount / signals.imageCount) * 10);
  const labelCoverage =
    signals.formControlCount === 0
      ? 10
      : Math.round((signals.labeledControlCount / signals.formControlCount) * 10);

  const experienceScore = clampScore(
    (signals.viewportMeta ? 12 : 0) +
      (signals.hasNav ? 10 : 0) +
      (signals.hasMain ? 10 : 0) +
      (signals.hasFooter ? 8 : 0) +
      (signals.wordCount >= 250 ? 12 : signals.wordCount >= 120 ? 8 : 3) +
      (signals.headingOrderIssues.length === 0 ? 12 : 4) +
      (signals.ctaTexts.length > 0 ? 10 : 0) +
      altCoverage +
      labelCoverage +
      (signals.internalLinkCount >= 3 ? 8 : signals.internalLinkCount > 0 ? 4 : 0) +
      (signals.buttonTexts.length > 0 ? 8 : 0)
  );
  const performanceScore = pageSpeed.data?.averagePerformanceScore;

  if (typeof performanceScore !== "number") {
    return experienceScore;
  }

  return clampScore(experienceScore * 0.65 + performanceScore * 0.35);
}

function buildTitleMetaFeedback(signals: ExtractedHtmlSignals) {
  const titleState = signals.title
    ? `Title found (${signals.title.length} characters): "${signals.title}".`
    : "No title tag was found.";
  const metaState = signals.metaDescription
    ? `Meta description found (${signals.metaDescription.length} characters).`
    : "No meta description was found.";
  const extras = [
    signals.canonicalUrl ? "Canonical URL is present." : "Add a canonical URL.",
    signals.robotsMeta ? `Robots meta: ${signals.robotsMeta}.` : "No robots meta tag was detected.",
    signals.ogTitle && signals.ogDescription
      ? "Open Graph title and description are present."
      : "Add Open Graph title and description for shared previews.",
  ];

  return `${titleState} ${metaState} ${extras.join(" ")}`;
}

function buildHeadingFeedback(signals: ExtractedHtmlSignals) {
  const h1Count = signals.headings.filter((heading) => heading.level === 1).length;
  const h2Count = signals.headings.filter((heading) => heading.level === 2).length;
  const h3Count = signals.headings.filter((heading) => heading.level === 3).length;
  const issueText =
    signals.headingOrderIssues.length > 0
      ? ` Issues: ${signals.headingOrderIssues.join(" ")}`
      : " Heading order looks structurally reasonable.";

  return `Detected ${h1Count} H1, ${h2Count} H2, and ${h3Count} H3 headings.${issueText}`;
}

function buildKeywordFeedback(signals: ExtractedHtmlSignals) {
  const placements = [
    signals.keyword.inTitle ? "title" : null,
    signals.keyword.inMeta ? "meta description" : null,
    signals.keyword.inHeadings ? "headings" : null,
    signals.keyword.inBody ? "body copy" : null,
  ].filter(Boolean);

  if (placements.length === 0) {
    return "The primary keyword was not found in the title, meta description, headings, or readable body text. Add it naturally where it clarifies the page promise.";
  }

  return `The primary keyword appears in ${placements.join(", ")} with ${signals.keyword.bodyOccurrences} body occurrence(s). Keep placement natural and avoid forcing repeated phrases.`;
}

function buildReadabilityFeedback(signals: ExtractedHtmlSignals) {
  const contentLength =
    signals.wordCount >= 250
      ? "The page has enough readable content for a meaningful first pass."
      : "The readable body content is light, which may limit both search context and visitor confidence.";
  const ctaText =
    signals.ctaTexts.length > 0
      ? `Detected CTA language such as "${signals.ctaTexts.slice(0, 3).join('", "')}".`
      : "No clear CTA language was detected.";

  return `${contentLength} ${ctaText} Viewport meta ${signals.viewportMeta ? "is present" : "is missing"}, which affects mobile rendering signals.`;
}

function buildAccessibilityFeedback(signals: ExtractedHtmlSignals) {
  const altText =
    signals.imageCount === 0
      ? "No images were detected."
      : `${signals.imagesWithAltCount}/${signals.imageCount} images include non-empty alt text.`;
  const labels =
    signals.formControlCount === 0
      ? "No form controls were detected."
      : `${signals.labeledControlCount}/${signals.formControlCount} form controls appear labeled.`;
  const landmarks =
    signals.landmarkCount >= 3
      ? "Core landmarks are present."
      : "Add clearer header, nav, main, and footer landmarks where appropriate.";

  return `${altText} ${labels} ${landmarks}`;
}

function buildPrioritizedFixes(
  signals: ExtractedHtmlSignals,
  seoScore: number,
  uxScore: number,
  pageSpeed: PageSpeedResult
): SeoUxFix[] {
  const fixes: SeoUxFix[] = [];

  if (!signals.title || !signals.metaDescription) {
    fixes.push({
      priority: "Critical",
      title: "Complete the title and meta description",
      detail:
        "Search results and social previews need a clear page promise before deeper optimization matters.",
    });
  }

  if (!signals.keyword.inTitle || !signals.keyword.inHeadings) {
    fixes.push({
      priority: seoScore < 75 ? "Critical" : "Important",
      title: "Align the page with the primary keyword",
      detail:
        "Use the keyword naturally in the title or H1/H2 structure so visitors and search engines see the page focus quickly.",
    });
  }

  if (signals.headingOrderIssues.length > 0) {
    fixes.push({
      priority: "Important",
      title: "Clean up heading hierarchy",
      detail:
        "Keep one H1 and avoid jumping heading levels so the page structure is easier to scan and navigate.",
    });
  }

  if (!signals.viewportMeta || uxScore < 70) {
    fixes.push({
      priority: "Important",
      title: "Improve mobile readability",
      detail:
        "Confirm mobile viewport behavior, shorten dense sections, and make the primary action easy to find on small screens.",
    });
  }

  if (signals.imageCount > signals.imagesWithAltCount) {
    fixes.push({
      priority: "Important",
      title: "Add missing image alt text",
      detail:
        "Describe meaningful images so assistive technology and search systems can understand visual content.",
    });
  }

  if (signals.ctaTexts.length === 0) {
    fixes.push({
      priority: "Critical",
      title: "Add a clear call to action",
      detail:
        "Give visitors one obvious next step that matches the page offer and intent.",
    });
  }

  if (pageSpeed.status !== "connected") {
    fixes.push({
      priority: "Nice-to-have",
      title: "Connect PageSpeed data",
      detail:
        "Enable Google PageSpeed Insights when you are ready to fold Core Web Vitals into the priority model.",
    });
  }

  if (pageSpeed.data) {
    for (const fix of buildPageSpeedFixes(pageSpeed.data)) {
      fixes.push(fix);
    }
  }

  if (fixes.length === 0) {
    fixes.push({
      priority: "Nice-to-have",
      title: "Refine proof and conversion context",
      detail:
        "The core scan looks solid. Add sharper proof near CTAs and keep testing message clarity against visitor intent.",
    });
  }

  return fixes.slice(0, 6);
}

function buildPageSpeedSummary(data: PageSpeedData | null) {
  if (!data) {
    return "PageSpeed is connected but did not return usable metrics for this page.";
  }

  const mobile = data.mobile;
  const desktop = data.desktop;
  const metricLines = [
    mobile ? formatPageSpeedStrategy(mobile) : "Mobile PageSpeed metrics were unavailable.",
    desktop
      ? formatPageSpeedStrategy(desktop)
      : "Desktop PageSpeed metrics were unavailable.",
  ];
  const feedback =
    data.feedback.length > 0
      ? ` Signals: ${data.feedback.join(" ")}`
      : " Signals: Core Web Vitals look usable in this first pass.";

  return `${metricLines.join(" ")} Average performance score: ${
    data.averagePerformanceScore ?? "not available"
  }/100.${feedback}`;
}

function formatPageSpeedStrategy(result: PageSpeedStrategyResult) {
  return `${capitalize(result.strategy)} performance ${
    result.performanceScore ?? "n/a"
  }/100; FCP ${formatMetric(result.fcp)}, LCP ${formatMetric(
    result.lcp
  )}, TBT ${formatMetric(result.tbt)}, CLS ${formatMetric(
    result.cls
  )}, Speed Index ${formatMetric(result.speedIndex)}.`;
}

function buildPageSpeedFeedback(results: PageSpeedStrategyResult[]) {
  const feedback = new Set<string>();

  for (const result of results) {
    if (isSlowLcp(result.lcp)) {
      feedback.add("Slow LCP detected.");
    }

    if (isHighCls(result.cls)) {
      feedback.add("High CLS causing layout shift.");
    }

    if (isHighTbt(result.tbt)) {
      feedback.add("Blocking scripts impacting TBT.");
    }

    if (isSlowFcp(result.fcp)) {
      feedback.add("Slow FCP delaying first visible content.");
    }

    if (isSlowSpeedIndex(result.speedIndex)) {
      feedback.add("Slow Speed Index affecting perceived load time.");
    }
  }

  return Array.from(feedback);
}

function buildPageSpeedFixes(data: PageSpeedData): SeoUxFix[] {
  const results = [data.mobile, data.desktop].filter(
    (result): result is PageSpeedStrategyResult => Boolean(result)
  );
  const fixes: SeoUxFix[] = [];

  if (results.some((result) => isSlowLcp(result.lcp))) {
    fixes.push({
      priority: "Critical",
      title: "Improve Largest Contentful Paint",
      detail:
        "Slow LCP detected. Optimize the hero image, server response, font loading, and above-the-fold rendering path.",
    });
  }

  if (results.some((result) => isHighCls(result.cls))) {
    fixes.push({
      priority: "Critical",
      title: "Reduce layout shift",
      detail:
        "High CLS causing layout shift. Reserve image/embed dimensions and avoid injecting banners or late-loading content above existing sections.",
    });
  }

  if (results.some((result) => isHighTbt(result.tbt))) {
    fixes.push({
      priority: "Important",
      title: "Reduce blocking JavaScript",
      detail:
        "Blocking scripts impacting TBT. Defer non-critical scripts, trim third-party tags, and split heavy client bundles.",
    });
  }

  if (results.some((result) => isSlowFcp(result.fcp))) {
    fixes.push({
      priority: "Important",
      title: "Speed up first content",
      detail:
        "Slow FCP delaying first visible content. Review render-blocking CSS, font strategy, and initial server response time.",
    });
  }

  if (results.some((result) => isSlowSpeedIndex(result.speedIndex))) {
    fixes.push({
      priority: "Nice-to-have",
      title: "Improve perceived load speed",
      detail:
        "Slow Speed Index affecting perceived load time. Prioritize above-the-fold content and lazy-load lower-priority media.",
    });
  }

  return fixes;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanText(match?.[1] ?? "") || null;
}

function extractMetaContent(html: string, key: string, keyType: "name" | "property") {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${keyType}\\s*=\\s*["']${escapeRegExp(key)}["'])(?=[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'])[^>]*>`,
    "i"
  );
  const match = html.match(pattern);
  return cleanText(match?.[1] ?? "") || null;
}

function extractLinkHref(html: string, rel: string) {
  const pattern = new RegExp(
    `<link\\b(?=[^>]*\\brel\\s*=\\s*["'][^"']*\\b${escapeRegExp(rel)}\\b[^"']*["'])(?=[^>]*\\bhref\\s*=\\s*["']([^"']*)["'])[^>]*>`,
    "i"
  );
  const match = html.match(pattern);
  return cleanText(match?.[1] ?? "") || null;
}

function extractHeadings(html: string): ExtractedHeading[] {
  return Array.from(html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi))
    .map((match) => ({
      level: Number(match[1]) as 1 | 2 | 3,
      text: cleanText(stripHtml(match[2] ?? "")),
    }))
    .filter((heading) => heading.text);
}

function extractLinks(html: string): ExtractedLink[] {
  return Array.from(html.matchAll(/<a\b(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/gi))
    .map((match) => ({
      href: cleanText(match[1] ?? ""),
      text: cleanText(stripHtml(match[2] ?? "")),
    }))
    .filter((link) => link.href);
}

function extractButtonTexts(html: string) {
  return Array.from(html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi))
    .map((match) => cleanText(stripHtml(match[1] ?? "")))
    .filter(Boolean)
    .slice(0, 12);
}

function extractFormControls(html: string) {
  const controlTags = html.match(/<(input|textarea|select)\b[^>]*>/gi) ?? [];
  const labelForIds = new Set(
    Array.from(html.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["'][^>]*>/gi))
      .map((match) => match[1])
      .filter(Boolean)
  );
  let labeled = 0;

  for (const tag of controlTags) {
    const id = tag.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
    const hasAria = /\baria-label\s*=\s*["'][^"']+["']/i.test(tag);
    const hasWrappedLabel = /<label\b[^>]*>[\s\S]*<(input|textarea|select)\b/i.test(html);

    if ((id && labelForIds.has(id)) || hasAria || hasWrappedLabel) {
      labeled += 1;
    }
  }

  return { total: controlTags.length, labeled };
}

function getHeadingOrderIssues(headings: ExtractedHeading[]) {
  const issues: string[] = [];
  const h1Count = headings.filter((heading) => heading.level === 1).length;

  if (h1Count === 0) {
    issues.push("Add one H1 that names the page promise.");
  } else if (h1Count > 1) {
    issues.push("Use one H1 and move secondary section titles to H2.");
  }

  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (previous && current && current.level - previous.level > 1) {
      issues.push(`Avoid jumping from H${previous.level} to H${current.level}.`);
      break;
    }
  }

  return issues;
}

function stripHtml(html: string): string {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

  return cleanText(withoutNoise.replace(/<[^>]+>/g, " "));
}

function cleanText(input: string) {
  return decodeHtmlEntities(input).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function includesKeyword(value: string | null, keyword: string) {
  return Boolean(value?.toLowerCase().includes(keyword));
}

function countKeywordOccurrences(value: string, keyword: string) {
  if (!keyword) {
    return 0;
  }

  return value.toLowerCase().split(keyword).length - 1;
}

function countLandmarks(html: string) {
  return (html.match(/<(header|nav|main|footer|aside)\b[^>]*>/gi) ?? []).length;
}

function formatMetric(metric: PageSpeedMetric) {
  if (metric.displayValue) {
    return metric.displayValue;
  }

  if (typeof metric.numericValue === "number") {
    return String(Math.round(metric.numericValue));
  }

  return "n/a";
}

function isSlowLcp(metric: PageSpeedMetric) {
  return typeof metric.numericValue === "number" && metric.numericValue > 2500;
}

function isHighCls(metric: PageSpeedMetric) {
  return typeof metric.numericValue === "number" && metric.numericValue > 0.1;
}

function isHighTbt(metric: PageSpeedMetric) {
  return typeof metric.numericValue === "number" && metric.numericValue > 200;
}

function isSlowFcp(metric: PageSpeedMetric) {
  return typeof metric.numericValue === "number" && metric.numericValue > 1800;
}

function isSlowSpeedIndex(metric: PageSpeedMetric) {
  return typeof metric.numericValue === "number" && metric.numericValue > 3400;
}

function isNumber(value: number | null): value is number {
  return typeof value === "number";
}

function isInternalLink(href: string, finalUrl: string, baseHost: string) {
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("?")) {
    return true;
  }

  try {
    return new URL(href, finalUrl).hostname === baseHost;
  } catch {
    return false;
  }
}

function isRedirect(status: number) {
  return status >= 300 && status < 400;
}

function isValidationError(error: unknown) {
  return (
    error instanceof Error &&
    /required|only http|embedded credentials|local or private|invalid url/i.test(
      error.message
    )
  );
}

function isPrivateAddress(address: string) {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;

    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && typeof b === "number" && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return true;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
