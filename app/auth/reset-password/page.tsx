// app/auth/reset-password/page.tsx — Entrepreneuria-Branded Reset Password Page
// Supports sending a Supabase password reset email

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Password reset link sent! Check your email.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brandNavyDark">
      <Card className="w-full max-w-md bg-brandNavy border border-brandBlue shadow-xl rounded-2xl">
        <CardHeader className="text-center space-y-3">
          <CardTitle className="text-3xl font-bold text-brandBlueLight">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-brandBlueLight/70 max-w-sm mx-auto">
            We'll send you a secure link to create a new password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-6">
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-brandBlueLight font-medium">Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-brandBlueLight absolute left-3 top-3" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-brandNavyDark border-brandBlue text-white"
                  placeholder="you@example.com"
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
              <p className="text-sm text-green-400 bg-green-950/40 border border-green-900 rounded-lg p-3">
                {success}
              </p>
            )}

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full bg-brandOrange hover:bg-brandOrangeLight text-white py-3 rounded-xl shadow-lg text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5 animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCcw className="h-5 w-5" />
                  Send Reset Link
                </div>
              )}
            </Button>
          </form>

          {/* BACK TO LOGIN */}
          <p className="text-center text-brandBlueLight/70 mt-6">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-brandBlueLight hover:text-brandBlueLight/80 font-medium">
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
