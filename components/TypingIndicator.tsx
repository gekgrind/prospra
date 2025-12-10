"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 ml-12">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <span className="text-white text-lg">•</span>
      </div>

      <div className="flex items-center space-x-1 bg-slate-800 text-slate-300 px-4 py-2 rounded-2xl">
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.1s]" />
        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
