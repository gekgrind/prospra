// app/upgrade/page.tsx — Prospra Premium Upgrade Page
// Fully Entrepreneuria branded + CTA for GPT‑4.1 Pro tier

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Sparkles, Crown, Check } from "lucide-react";

export default function UpgradePage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <div className="text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-brandOrange flex items-center justify-center shadow-lg">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-brandBlueLight">Prospra Premium</h1>
        <p className="text-brandBlueLight/80 text-lg max-w-xl mx-auto">
          Unlock deeper strategy, faster insights, and the full power of GPT‑4.1 Pro — designed for ambitious founders.
        </p>
      </div>

      {/* PRICING CARD */}
      <Card className="bg-brandNavy border border-brandBlue shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-brandBlueLight text-2xl">Premium Plan</CardTitle>
          <CardDescription className="text-brandBlueLight/70">
            Everything you need to build and scale with clarity.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* PRICE */}
          <div className="text-center">
            <p className="text-5xl font-extrabold text-brandOrange">$19<span className="text-3xl">/mo</span></p>
            <p className="text-brandBlueLight/60 mt-2">Cancel anytime</p>
          </div>

          {/* FEATURES LIST */}
          <div className="space-y-4">
            <Feature text="GPT‑4.1 Pro mentor model (premium responses)" />
            <Feature text="Longer context — deeper strategic answers" />
            <Feature text="Unlimited mentor chats" />
            <Feature text="Advanced problem‑solving guidance" />
            <Feature text="Weekly growth insights based on your journal" />
            <Feature text="Priority support & early feature access" />
          </div>

          {/* CTA BUTTON */}
          <form action="/api/upgrade" method="POST" className="text-center">
            <Button className="bg-brandOrange hover:bg-brandOrangeLight text-white text-lg px-8 py-4 rounded-xl shadow-lg">
              Upgrade to Premium
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* BACK LINK */}
      <div className="text-center">
        <Link href="/dashboard" className="text-brandBlueLight/70 hover:text-brandBlueLight">Back to Dashboard</Link>
      </div>
    </div>
  );
}

// Feature line component
function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-md bg-brandBlue/20 flex items-center justify-center">
        <Check className="h-4 w-4 text-brandBlueLight" />
      </div>
      <span className="text-brandBlueLight/90">{text}</span>
    </div>
  );
}
