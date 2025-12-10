import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Prospra</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Log In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance">
            Your AI-Powered
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Entrepreneurial </span>
            Mentor
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed text-pretty">
            Transform your business ideas into reality with personalized guidance, 
            strategic insights, and 24/7 support from your AI mentor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                Start Your Journey
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-slate-700 text-slate-300 hover:bg-slate-800">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI Mentor Chat"
              description="Get instant answers, strategic advice, and personalized guidance anytime you need it."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8" />}
              title="Goal Tracking"
              description="Set milestones, track progress, and celebrate wins as you build your business."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Daily Journal"
              description="Reflect on your journey, document challenges, and track your entrepreneurial growth."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Business Planning"
              description="Create comprehensive business plans with AI-powered insights and templates."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8" />}
              title="Market Research"
              description="Analyze your market, competitors, and opportunities with intelligent insights."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Resource Library"
              description="Access curated resources, guides, and tools to support your entrepreneurial journey."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Build Your Future?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join entrepreneurs who are transforming their ideas into successful businesses.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 text-lg px-8 py-6">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>© 2025 Prospra. Empowering entrepreneurs everywhere.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-indigo-600/50 transition-colors">
      <div className="h-12 w-12 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
