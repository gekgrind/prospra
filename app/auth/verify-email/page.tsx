import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Sparkles } from 'lucide-react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
          </div>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-indigo-600/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-indigo-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white text-center">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-slate-400 text-center">
                We've sent a confirmation link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-slate-300 mb-6 leading-relaxed">
                Click the link in the email to verify your account and complete your registration. 
                Once verified, you'll be able to access your dashboard and start your entrepreneurial journey.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                  Return to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
