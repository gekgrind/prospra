import PromptLabClient from "@/components/prompt-lab/PromptLabClient";

export default function PromptLabPage() {
  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-violet-400" />
        Core Prospra Intelligence
      </div>
      <PromptLabClient />
    </div>
  );
}
