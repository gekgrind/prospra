"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const run = async () => {
      try {
        // Play whoosh SFX if available
        const audio = new Audio("/sfx/whoosh.mp3");
        audio.play().catch(() => {
          // Non-blocking if user hasn't interacted yet
        });
      } catch (e) {
        console.warn("Whoosh sound failed:", e);
      }

      // Actually sign out
      await supabase.auth.signOut();

      // Give the vortex a moment to "swallow" them
      setTimeout(() => {
        router.push("/");
      }, 2000);
    };

    run();
  }, [router, supabase]);

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-brandNavyDark">
      {/* Nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,124,167,0.25),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(210,122,44,0.20),_transparent_60%)] animate-stellarBurst pointer-events-none" />

      {/* VORTEX */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-8 md:-translate-y-12">
        <div
          className="
            rounded-full border-[6px] border-brandOrange/80
            animate-gateSpinCCW
            w-[260px] h-[260px]
            sm:w-[320px] sm:h-[320px]
            md:w-[380px] md:h-[380px]
            lg:w-[440px] lg:h-[440px]
          "
        />
        <div
          className="
            absolute rounded-full border-[4px] border-brandBlueLight/70
            animate-gateSpinCW
            w-[200px] h-[200px]
            sm:w-[260px] sm:h-[260px]
            md:w-[320px] md:h-[320px]
            lg:w-[380px] lg:h-[380px]
          "
        />
        <div
          className="
            absolute rounded-full bg-brandOrange/20 animate-gatePulse
            w-[320px] h-[320px]
            sm:w-[380px] sm:h-[380px]
            md:w-[440px] md:h-[440px]
          "
        />
      </div>

      {/* UI */}
      <div className="relative z-[100] w-full max-w-sm">
        <Card className="bg-transparent border-none shadow-none text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-brandBlueLight">
              Logging you out…
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brandBlueLight/80">
              Closing your Prospra portal and clearing your session.
              <br />
              You&apos;ll be back at the main gateway in just a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
