function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-[#4f7ca7]/20 bg-[rgba(10,20,38,0.72)] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent" />
      <div className="animate-pulse space-y-4 p-6 md:p-7">
        <div className="h-3 w-28 rounded-full bg-[#00D4FF]/20" />
        <div className="h-8 w-2/3 rounded-full bg-white/10" />
        <div className="h-4 w-full rounded-full bg-white/8" />
        <div className="h-4 w-4/5 rounded-full bg-white/8" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(79,124,167,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(79,124,167,0.16)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,212,255,0.14),transparent_24%),linear-gradient(180deg,rgba(7,17,31,0.82)_0%,rgba(7,17,31,0.98)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
        <SkeletonCard className="mb-8 min-h-[300px]" />

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {["plan", "mentor", "board", "action"].map((item) => (
            <SkeletonCard key={item} className="min-h-[150px]" />
          ))}
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <SkeletonCard className="min-h-[320px]" />
            <SkeletonCard className="min-h-[210px]" />
            <SkeletonCard className="min-h-[260px]" />
          </div>
          <div className="space-y-8">
            <SkeletonCard className="min-h-[210px]" />
            <SkeletonCard className="min-h-[240px]" />
            <SkeletonCard className="min-h-[240px]" />
          </div>
        </section>
      </div>
    </div>
  );
}
