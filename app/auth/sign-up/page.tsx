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
import { Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

console.log("Signup page rendered!");

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activateGate, setActivateGate] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setActivateGate(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      setActivateGate(false);
      return;
    }

    // Make sure Supabase fully initializes the session cookie
    await supabase.auth.getSession();

    // New users go to onboarding
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4 py-10 overflow-hidden bg-brandNavyDark">
      {/* Nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,124,167,0.25),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(210,122,44,0.20),_transparent_60%)] animate-stellarBurst pointer-events-none" />

      {/* PORTAL LAYER */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-8 md:-translate-y-12">
        {/* OUTER RING */}
        <div
          className="
            rounded-full border-[5px] border-brandBlueLight/70
            animate-gateSpinCW
            w-[240px] h-[240px]
            sm:w-[310px] sm:h-[310px]
            md:w-[390px] md:h-[390px]
            lg:w-[450px] lg:h-[450px]
            xl:w-[520px] xl:h-[520px]
          "
        />
        {/* INNER RING */}
        <div
          className="
            absolute rounded-full border-[4px] border-brandOrange/80
            animate-gateSpinCCW
            w-[200px] h-[200px]
            sm:w-[260px] sm:h-[260px]
            md:w-[330px] h-[330px]
            lg:w-[380px] lg:h-[380px]
            xl:w-[440px] xl:h-[440px]
          "
        />
        {/* PULSE */}
        {activateGate && (
          <div
            className="
              absolute rounded-full bg-brandOrange/20 animate-gatePulse
              w-[300px] h-[300px]
              sm:w-[360px] sm:h-[360px]
              md:w-[460px] md:h-[460px]
              lg:w-[520px] h-[520px]
              xl:w-[580px] h-[580px]
            "
          />
        )}
      </div>

      {/* UI */}
      <div className="relative z-[100] w-full max-w-sm">
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="text-center space-y-3 pt-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brandOrange flex items-center justify-center shadow-[0_15px_35px_rgba(210,122,44,0.7)]">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-brandBlueLight">
              Join Prospra
            </CardTitle>
            <CardDescription className="text-brandBlueLight/70">
              Step through the portal and begin your journey.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Email */}
              <div className="relative backdrop-blur-md rounded-xl">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-brandBlueLight/70" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="pl-10 bg-brandNavy/40 text-white border-brandBlue/70"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="relative backdrop-blur-md rounded-xl">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-brandBlueLight/70" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 bg-brandNavy/40 text-white border-brandBlue/70"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-brandBlueLight/60"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              {/* Button */}
              <Button
                disabled={loading}
                className="w-full bg-brandOrange text-white text-lg py-4 rounded-xl"
              >
                {loading ? "Initializing Portal..." : "Create Account"}
              </Button>

              <p className="text-center text-brandBlueLight/70">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-brandOrange font-medium"
                >
                  Log in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
