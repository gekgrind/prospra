// app/profile/page.tsx (Entrepreneuria-branded Profile Page)

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Profile Page — view & update user onboarding details
export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  async function updateProfile(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const full_name = formData.get("full_name") as string;
    const business_idea = formData.get("business_idea") as string;
    const experience_level = formData.get("experience_level") as string;
    const industry = formData.get("industry") as string;

    await supabase.from("profiles").update({
      full_name,
      business_idea,
      experience_level,
      industry,
    }).eq("id", user!.id);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <h1 className="text-4xl font-bold text-brandBlueLight">Your Profile</h1>
      <p className="text-brandBlueLight/80 mb-6">Update your entrepreneurial details and preferences.</p>

      <Card className="bg-brandNavy border border-brandBlue shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-brandBlueLight text-2xl">Profile Details</CardTitle>
          <CardDescription className="text-brandBlueLight/70">Keep your information up-to-date so Prospra can personalize your mentoring experience.</CardDescription>
        </CardHeader>

        <CardContent>
          <form action={updateProfile} className="space-y-6">
            {/* FULL NAME */}
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-brandBlueLight font-medium">Full Name</label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile?.full_name || ""}
                className="bg-brandNavyDark border-brandBlue text-white"
              />
            </div>

            {/* BUSINESS IDEA */}
            <div className="space-y-2">
              <label htmlFor="business_idea" className="text-brandBlueLight font-medium">Business Idea</label>
              <Textarea
                id="business_idea"
                name="business_idea"
                defaultValue={profile?.business_idea || ""}
                className="min-h-[120px] bg-brandNavyDark border-brandBlue text-white"
              />
            </div>

            {/* EXPERIENCE LEVEL */}
            <div className="space-y-2">
              <label htmlFor="experience_level" className="text-brandBlueLight font-medium">Experience Level</label>
              <Input
                id="experience_level"
                name="experience_level"
                defaultValue={profile?.experience_level || ""}
                className="bg-brandNavyDark border-brandBlue text-white"
              />
            </div>

            {/* INDUSTRY */}
            <div className="space-y-2">
              <label htmlFor="industry" className="text-brandBlueLight font-medium">Industry</label>
              <Input
                id="industry"
                name="industry"
                defaultValue={profile?.industry || ""}
                className="bg-brandNavyDark border-brandBlue text-white"
              />
            </div>

            <Button type="submit" className="bg-brandOrange hover:bg-brandOrangeLight text-white font-semibold px-6 py-3 rounded-xl shadow-lg">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
