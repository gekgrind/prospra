// components/LoadingDots.tsx

export default function LoadingDots() {
  return (
    <div className="flex items-center gap-2 text-brandBlueLight animate-pulse pl-2">
      <span className="w-2 h-2 bg-brandBlueLight rounded-full"></span>
      <span className="w-2 h-2 bg-brandBlueLight rounded-full animation-delay-200"></span>
      <span className="w-2 h-2 bg-brandBlueLight rounded-full animation-delay-400"></span>
    </div>
  );
}
