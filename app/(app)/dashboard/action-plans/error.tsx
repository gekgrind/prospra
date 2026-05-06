"use client";

import Link from "next/link";
import { MessageSquare, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ActionPlansError({ reset }: { reset: () => void }) {
  return (
    <Card className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <CardContent className="p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fff3a6]">
          Action plans unavailable
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Prospra could not load this execution center.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c7d8ea]/74">
          Retry the page, or continue in AI Mentor and return once the saved
          plan data is available.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={reset}
            variant="outline"
            className="h-10 rounded-full border-[#00D4FF]/25 bg-[#0f223d] px-4 text-sm font-semibold text-white hover:border-[#00D4FF]/45 hover:bg-[#143055] hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-white/10 bg-white/5 px-4 text-sm font-medium text-[#dce9f7] hover:bg-white/10 hover:text-white"
          >
            <Link href="/mentor">
              <MessageSquare className="h-4 w-4" />
              AI Mentor
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
