// app/auth/update-password/page.tsx — Entrepreneuria-Branded Update Password Page
// This page is REQUIRED by Supabase for password reset links to complete.
// Users land here *after* clicking the reset link in their email.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, KeyRound, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Your password has been updated successfully!");

    setTimeout(() => {
      router.push("/auth/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brandNavyDark">
      <Card className="w-full max-w-md bg-brandNavy border border-brandBlue shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-3">
          <CardTitle className="text-3xl font-bold text-brandBlueLight">Set a New Password</CardTitle>
          <CardDescription className="text-brandBlueLight/70 max-w-sm mx-auto">
            Enter a new secure password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* NEW PASSWORD */}
            <div className="space-y-2">
              <label className="text-brandBlueLight font-medium">New Password</label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-brandBlueLight absolute left-3 top-3" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-brandNavyDark border-brandBlue text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div className="space-y-2">
              <label className="text-brandBlueLight font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-brandBlueLight absolute left-3 top-3" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-brandNavyDark border-brandBlue text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg p-3">
                {error}
              </p>
            )}

            {/* SUCCESS */}
            {success && (
              <p className="text-sm text-green-400 bg-green-950/40 border border-green-900 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {success}
              </p>
            )}

            {/* UPDATE BUTTON */}
            <Button
              type="submit"
              className="w-full bg-brandOrange hover:bg-brandOrangeLight text-white py-3 rounded-xl shadow-lg text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 animate-spin" />
                  Updating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Update Password
                </div>
              )}
            </Button>
          </form>

          {/* BACK TO LOGIN */}
          <p className="text-center text-brandBlueLight/70 mt-6">
            Back to{' '}
            <Link
              href="/auth/login"
              className="text-brandBlueLight hover:text-brandBlueLight/80 font-medium"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
