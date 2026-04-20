"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Oswald, Josefin_Sans, JetBrains_Mono } from "next/font/google";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Sparkles, Copy, RotateCcw, WandSparkles } from "lucide-react";
import {
  AUDIENCE_TYPES,
  GeneratedPrompt,
  PLATFORM_OPTIONS,
  PromptLabFormState,
  SECONDARY_TONES,
  TASK_TYPES,
  initialPromptLabFormState,
} from "@/lib/prompt-lab/types";
import { promptLabReducer, validatePromptLab } from "@/lib/prompt-lab/state";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const josefin = Josefin_Sans({ subsets: ["latin"], variable: "--font-josefin" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

const HISTORY_KEY = "prospra_prompt_lab_history_v1";

export default function PromptLabClient() {
  const [state, dispatch] = useReducer(promptLabReducer, initialPromptLabFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof PromptLabFormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPrompt | null>(null);
  const [typedPrompt, setTypedPrompt] = useState("");
  const [history, setHistory] = useState<GeneratedPrompt[]>([]);

  useEffect(() => {
    const existing = localStorage.getItem(HISTORY_KEY);
    if (existing) setHistory(JSON.parse(existing));
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
  }, [history]);

  useEffect(() => {
    if (!generated?.prompt) return;
    setTypedPrompt("");
    let idx = 0;
    const timer = setInterval(() => {
      idx += 6;
      setTypedPrompt(generated.prompt.slice(0, idx));
      if (idx >= generated.prompt.length) clearInterval(timer);
    }, 12);
    return () => clearInterval(timer);
  }, [generated?.id, generated?.prompt]);

  const platformBadge = useMemo(
    () => PLATFORM_OPTIONS.find((option) => option.value === (generated?.platform as PromptLabFormState["platform"] | undefined) || option.label === generated?.platform)
      ?? PLATFORM_OPTIONS.find((option) => option.value === state.platform),
    [generated?.platform, state.platform],
  );

  const onGenerate = async (action: "generate" | "improve" = "generate") => {
    const validationErrors = validatePromptLab(state);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, form: state, existingPrompt: generated?.prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prompt");

      const scoreRes = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "score", form: state, existingPrompt: data.prompt }),
      });
      const scoreData = await scoreRes.json();

      const entry: GeneratedPrompt = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        platform: data.platform,
        prompt: data.prompt,
        techniques: data.techniques || [],
        whyItWorks: data.whyItWorks || [],
        score: scoreData.score,
      };
      setGenerated(entry);
      setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${oswald.variable} ${josefin.variable} ${jetbrains.variable} grid gap-8 xl:grid-cols-[1.15fr_1fr]`}>
      <Card className="border border-slate-800/70 bg-slate-950/85 shadow-2xl shadow-black/30">
        <CardHeader className="space-y-3 pb-5">
          <CardTitle className="font-[family-name:var(--font-oswald)] text-3xl tracking-wide text-white md:text-[2rem]">Prompt Lab</CardTitle>
          <CardDescription className="font-[family-name:var(--font-josefin)] text-slate-300">
            Guided prompt engineering for founders. Define intent once, generate premium prompts for any platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="multiple" defaultValue={["task", "audience"]} className="space-y-3">
            <AccordionItem value="task" className="rounded-xl border border-slate-800/80 bg-slate-900/35 px-4">
              <AccordionTrigger className="font-semibold text-slate-100">1. Task</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Label>Task type *</Label>
                <Select value={state.taskType} onValueChange={(value) => dispatch({ type: "SET_FIELD", field: "taskType", value })}>
                  <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                  <SelectContent>{TASK_TYPES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
                {state.taskType === "Other" && <Input placeholder="Describe task type" value={state.taskTypeOther} onChange={(e) => dispatch({ type: "SET_FIELD", field: "taskTypeOther", value: e.target.value })} />}
                <Textarea placeholder="Objective *" value={state.objective} onChange={(e) => dispatch({ type: "SET_FIELD", field: "objective", value: e.target.value })} />
                <div className="space-y-2 rounded-lg border border-slate-600/80 bg-slate-900/80 p-3">
                  <Label className="text-slate-100">Platform / Destination</Label>
                  <Select value={state.platform} onValueChange={(value) => dispatch({ type: "SET_FIELD", field: "platform", value })}>
                    <SelectTrigger className="border-slate-600 bg-slate-950/60">
                      <SelectValue placeholder="Select platform / destination (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.platform === "other" && (
                    <Input
                      placeholder="Custom Platform / Destination"
                      value={state.customPlatform}
                      onChange={(e) => dispatch({ type: "SET_FIELD", field: "customPlatform", value: e.target.value })}
                    />
                  )}
                  {errors.customPlatform && <p className="text-xs text-rose-300">{errors.customPlatform}</p>}
                </div>
                <Textarea placeholder="Desired deliverable *" value={state.deliverable} onChange={(e) => dispatch({ type: "SET_FIELD", field: "deliverable", value: e.target.value })} />
                <Textarea placeholder="Constraints, limits, must-haves" value={state.constraints} onChange={(e) => dispatch({ type: "SET_FIELD", field: "constraints", value: e.target.value })} />
                {errors.objective && <p className="text-xs text-rose-300">{errors.objective}</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="audience" className="rounded-xl border border-slate-800/80 bg-slate-900/35 px-4">
              <AccordionTrigger className="font-semibold text-slate-100">2. Audience</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Label>Audience type *</Label>
                <Select value={state.audienceType} onValueChange={(value) => dispatch({ type: "SET_FIELD", field: "audienceType", value })}>
                  <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                  <SelectContent>{AUDIENCE_TYPES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
                {state.audienceType === "Other" && <Input placeholder="Describe audience" value={state.audienceTypeOther} onChange={(e) => dispatch({ type: "SET_FIELD", field: "audienceTypeOther", value: e.target.value })} />}
                <Textarea placeholder="Audience details *" value={state.audienceDetails} onChange={(e) => dispatch({ type: "SET_FIELD", field: "audienceDetails", value: e.target.value })} />
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["cold", "Cold"],
                    ["warm", "Warm"],
                    ["hot", "Hot"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => dispatch({ type: "SET_FIELD", field: "awarenessLevel", value })} className={`rounded-lg border px-3 py-2 text-sm transition ${state.awarenessLevel === value ? "border-sky-400/75 bg-sky-500/10 text-sky-200 shadow-sm shadow-sky-900/60" : "border-slate-700/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tone" className="rounded-xl border border-slate-800/80 bg-slate-900/35 px-4">
              <AccordionTrigger className="font-semibold text-slate-100">3. Tone</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-1">
                <Input placeholder="Primary tone" value={state.tonePrimary} onChange={(e) => dispatch({ type: "SET_FIELD", field: "tonePrimary", value: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  {SECONDARY_TONES.map((tone) => (
                    <button key={tone} type="button" onClick={() => dispatch({ type: "TOGGLE_CHIP", field: "toneSecondary", value: tone })} className={`rounded-full border px-3 py-1 text-xs transition ${state.toneSecondary.includes(tone) ? "border-amber-300/75 bg-amber-400/10 text-amber-100" : "border-slate-700/80 text-slate-300 hover:border-slate-500"}`}>
                      {tone}
                    </button>
                  ))}
                </div>
                <Input placeholder="Tones/phrases to avoid" value={state.noGoTone} onChange={(e) => dispatch({ type: "SET_FIELD", field: "noGoTone", value: e.target.value })} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="advanced" className="rounded-lg border border-slate-700/70 px-4">
              <AccordionTrigger className="font-semibold text-slate-100">4. Advanced</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={state.outputLength} onValueChange={(value) => dispatch({ type: "SET_FIELD", field: "outputLength", value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Format preference" value={state.formatPreference} onChange={(e) => dispatch({ type: "SET_FIELD", field: "formatPreference", value: e.target.value })} />
                </div>
                <Input placeholder="Model/variant (optional)" value={state.platformVariant} onChange={(e) => dispatch({ type: "SET_FIELD", field: "platformVariant", value: e.target.value })} />
                <Textarea placeholder="Success criteria" value={state.successCriteria} onChange={(e) => dispatch({ type: "SET_FIELD", field: "successCriteria", value: e.target.value })} />
                <Textarea placeholder="Additional context" value={state.contextDump} onChange={(e) => dispatch({ type: "SET_FIELD", field: "contextDump", value: e.target.value })} />
                <div className="flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 text-sm text-slate-200"><Switch checked={state.includeExamples} onCheckedChange={(checked) => dispatch({ type: "SET_FIELD", field: "includeExamples", value: checked })} />Include examples</label>
                  <label className="flex items-center gap-2 text-sm text-slate-200"><Switch checked={state.includeFrameworks} onCheckedChange={(checked) => dispatch({ type: "SET_FIELD", field: "includeFrameworks", value: checked })} />Include frameworks</label>
                  <label className="flex items-center gap-2 text-sm text-slate-200"><Switch checked={state.memoryEnabled} onCheckedChange={(checked) => dispatch({ type: "SET_FIELD", field: "memoryEnabled", value: checked })} />Use my Prospra context</label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={() => onGenerate("generate")} disabled={loading} className="bg-gradient-to-r from-sky-600 to-indigo-500 text-white hover:shadow-lg hover:shadow-sky-500/30">
              <Sparkles className="mr-2 h-4 w-4" /> {loading ? "Generating..." : "Generate prompt"}
            </Button>
            <Button variant="outline" onClick={() => onGenerate("improve")} disabled={loading || !generated}>
              <WandSparkles className="mr-2 h-4 w-4" /> Make this better
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="border border-slate-800/70 bg-slate-950/85 shadow-2xl shadow-black/20">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-4">
            <div>
              <CardTitle className="font-[family-name:var(--font-oswald)] text-2xl text-white md:text-[1.75rem]">Output</CardTitle>
              <CardDescription className="mt-1 text-slate-300">Platform-optimized prompt with founder-ready structure.</CardDescription>
            </div>
            {platformBadge && <Badge className="border border-slate-700/70 bg-slate-900 text-sky-200">{platformBadge.label} · {platformBadge.badge}</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            {!generated ? (
              <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/35 p-10 text-center">
                <p className="text-sm font-medium text-slate-200">No prompt generated yet.</p>
                <p className="mt-2 text-sm text-slate-400">Define your intent on the left, then generate your first founder-ready prompt.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <pre className="max-h-[390px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-slate-200 font-[family-name:var(--font-jetbrains)]">{typedPrompt}</pre>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={async () => {
                    await navigator.clipboard.writeText(generated.prompt);
                    setCopyDone(true);
                    setTimeout(() => setCopyDone(false), 1300);
                  }}><Copy className="mr-1 h-4 w-4" /> {copyDone ? "Copied" : "Copy"}</Button>
                  <Button size="sm" variant="outline" onClick={() => onGenerate("generate")}><RotateCcw className="mr-1 h-4 w-4" /> Regenerate</Button>
                </div>
                <div className="space-y-2 rounded-xl border border-emerald-700/35 bg-emerald-900/10 p-3.5">
                  <p className="text-sm font-semibold text-emerald-200">Why this prompt works</p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-emerald-100/90">{generated.whyItWorks.map((line, idx) => <li key={idx}>{line}</li>)}</ul>
                </div>
                {generated.score && (
                  <div className="rounded-xl border border-sky-700/35 bg-sky-900/10 p-3.5">
                    <p className="mb-2 text-sm font-semibold text-sky-100">Prompt score: {generated.score.overall}/100</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {generated.score.categories.map((category) => <p key={category.label} className="text-xs text-slate-200">{category.label}: <span className="text-sky-200">{category.score}</span></p>)}
                    </div>
                    <ul className="mt-2 list-disc pl-5 text-xs text-slate-300">{generated.score.suggestions.map((item, idx) => <li key={idx}>{item}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-800/70 bg-slate-950/75">
          <CardHeader>
            <CardTitle className="text-lg text-white">Prompt history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.length === 0 ? <p className="rounded-lg border border-dashed border-slate-700/70 bg-slate-900/35 px-3 py-4 text-xs text-slate-400">No prompts yet.</p> : history.slice(0, 5).map((item) => (
              <button key={item.id} className="block w-full rounded-lg border border-slate-700/80 bg-slate-900/35 px-3 py-2.5 text-left text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-900/60" onClick={() => setGenerated(item)}>
                <div className="mb-1 flex items-center justify-between"><span>{item.platform}</span><span>{new Date(item.createdAt).toLocaleTimeString()}</span></div>
                <p className="line-clamp-2">{item.prompt}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><Info className="h-4 w-4" /></TooltipTrigger>
              <TooltipContent>Prompt templates, benchmarks, and saved prompts are designed for future extension.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          Prompt engine is template-ready for upcoming library + saved prompt modules.
        </div>
      </div>
    </div>
  );
}
