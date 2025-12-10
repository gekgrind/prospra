// /app/api/website/ux-scan/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url as string | undefined;

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // For now: just proxy to your existing scoring/analyzer endpoint if you have one
    // or return mock data while wiring up the UI.

    // TODO: Replace this with a real call into your website analyzer / screenshot logic
    const result = {
      url,
      seoScore: 72,
      uxScore: 68,
      clarityScore: 74,
      ctaScore: 63,
      mobileScore: 70,
      notes: [
        "Your primary call-to-action could be more visually distinct.",
        "Above-the-fold copy is decent but could state your core outcome more boldly.",
        "Mobile hero section feels cramped – consider tightening padding and font sizes.",
      ],
      sections: [
        {
          id: "hero",
          label: "Hero Section",
          score: 70,
          issues: ["Headline clarity", "CTA contrast"],
        },
        {
          id: "offer",
          label: "Offer / Benefits",
          score: 75,
          issues: ["Add social proof closer to pricing"],
        },
        {
          id: "footer",
          label: "Footer",
          score: 60,
          issues: ["Missing trust badges", "Weak navigation"],
        },
      ],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[UX_SCAN_ERROR]", err);
    return NextResponse.json(
      { error: "Failed to run UX scan" },
      { status: 500 }
    );
  }
}
