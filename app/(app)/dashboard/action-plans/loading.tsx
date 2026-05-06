import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <Card
      className={`relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <CardContent className="space-y-4 p-5 md:p-6">
        <SkeletonBlock className="h-3 w-28 bg-[#00D4FF]/20" />
        <SkeletonBlock className="h-6 w-2/3" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}

export default function ActionPlansLoading() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
        <CardHeader className="space-y-4">
          <SkeletonBlock className="h-5 w-52 bg-[#00D4FF]/20" />
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
        </CardHeader>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SkeletonCard className="xl:col-span-2" />
        <SkeletonCard />
        <SkeletonCard className="xl:row-span-2" />
        <SkeletonCard />
      </div>
    </div>
  );
}
