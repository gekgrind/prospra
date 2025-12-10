import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-xl text-slate-400">
          Manage your account and preferences
        </p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-slate-400">
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Email</p>
            <p className="text-white mt-1">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Full Name</p>
            <p className="text-white mt-1">{profile?.full_name || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Industry</p>
            <p className="text-white mt-1">{profile?.industry || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Experience Level</p>
            <p className="text-white mt-1 capitalize">
              {profile?.experience_level?.replace("-", " ") || "Not set"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
