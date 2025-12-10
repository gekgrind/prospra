"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

export function OnboardingForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    await supabase.from("profiles").upsert({
      id: "USER_ID_PLACEHOLDER",
      full_name: formData.get("fullName"),
      experience_level: formData.get("experience"),
      business_type: formData.get("business"),
      goals: formData.get("goals"),
      subscription_tier: "free"
    });

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="fullName" placeholder="Your Name" className="w-full p-3 border rounded" />
      <input name="experience" placeholder="Experience Level" className="w-full p-3 border rounded" />
      <input name="business" placeholder="Business Type" className="w-full p-3 border rounded" />
      <input name="goals" placeholder="Your Goals" className="w-full p-3 border rounded" />

      <button className="w-full py-3 bg-[#4f7ca7] text-white rounded-xl">
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
