"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Plus,
  Loader2,
  BookOpen,
  Calendar,
  Smile,
  Meh,
  Frown,
  CloudRain,
  Sparkles,
  Timer,
  Brain,
} from "lucide-react";

import { format } from "date-fns";

type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string | null;
  progress_notes: string | null;
  challenges: string | null;
  wins: string | null;
  mood: string | null;
  created_at: string;
};

type MoodValue = "awesome" | "good" | "meh" | "rough";

const MOODS = [
  { value: "awesome", label: "On Fire", icon: Smile, color: "text-emerald-400" },
  { value: "good", label: "Optimistic", icon: Meh, color: "text-sky-400" },
  { value: "meh", label: "Mixed Bag", icon: Frown, color: "text-amber-400" },
  { value: "rough", label: "Tough Day", icon: CloudRain, color: "text-red-400" },
];

const defaultFormData = {
  progressNotes: "",
  challenges: "",
  wins: "",
  mood: "" as MoodValue | "",
};

export default function JournalPage() {
  const supabase = createClient();

  const [user, setUser] = useState<any | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  // NEW AI STATE
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Load user + entries
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      // 🚨 Email NOT confirmed → redirect
      if (user && !user.email_confirmed_at) {
        window.location.href = "/verify-email";
        return;
      }

      if (user) await loadEntries(user.id);
      setIsLoading(false);
    }

    init();
  }, []);

  async function loadEntries(userId: string) {
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      setEntries(data);
      if (!selectedEntry && data.length > 0) {
        setSelectedEntry(data[0]);
      }
    }
  }

  const handleNewEntry = () => {
    setShowNewEntry(true);
    setSelectedEntry(null);
    setFormData(defaultFormData);
    setAiResponse(null); // clear AI output
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowNewEntry(false);
    setAiResponse(null);

    setFormData({
      progressNotes: entry.progress_notes || "",
      challenges: entry.challenges || "",
      wins: entry.wins || "",
      mood: (entry.mood as MoodValue) || "",
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        entry_date: new Date().toISOString(),
        progress_notes: formData.progressNotes || null,
        challenges: formData.challenges || null,
        wins: formData.wins || null,
        mood: formData.mood || null,
      });

      await loadEntries(user.id);
      setShowNewEntry(false);
      setFormData(defaultFormData);
      setAiResponse(null);
    } finally {
      setIsSaving(false);
    }
  };

  // --- AI REQUEST ---
  async function runAI(mode: string) {
    setAiLoading(true);
    setAiResponse(null);

    const payload = {
      mode,
      mood: formData.mood,
      progressNotes: formData.progressNotes,
      challenges: formData.challenges,
      wins: formData.wins,
      userId: user.id,
    };

    const res = await fetch("/api/journal-ai", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setAiResponse(data.text || "No response.");
    setAiLoading(false);
  }

  const getMoodDisplay = (mood: string | null) => {
    if (!mood) return null;
    const moodData = MOODS.find((m) => m.value === mood);
    if (!moodData) return null;
    const Icon = moodData.icon;

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${moodData.color}`} />
        <span className="text-brandBlueLight capitalize">{moodData.label}</span>
      </div>
    );
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandNavyDark text-brandBlueLight">
        <Card className="bg-brandNavy border border-brandBlue p-8 max-w-md text-center">
          <CardTitle className="text-2xl mb-3">Sign in to use your journal</CardTitle>
          <p className="text-brandBlueLight/70">
            Your entries are securely tied to your Prospra account.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brandNavyDark text-brandBlueLight px-6 py-10">
      <div className="flex gap-6 h-[calc(100vh-140px)] max-w-6xl w-full">
        {/* LEFT PANEL */}
        <div className="w-80 flex-shrink-0">
          <Card className="bg-brandNavy border border-brandBlue h-full flex flex-col rounded-xl shadow-lg">
            {/* New Entry */}
            <div className="p-4 border-b border-brandBlue/50">
              <Button
                onClick={handleNewEntry}
                className="w-full bg-brandOrange hover:bg-brandOrangeLight text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>

            {/* Entry List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brandBlueLight" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-brandBlueLight mx-auto mb-3" />
                  <p className="text-sm text-brandBlueLight/70">No journal entries yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleSelectEntry(entry)}
                      className={`w-full text-left p-3 rounded-lg transition-all border text-sm
                        ${
                          selectedEntry?.id === entry.id
                            ? "bg-brandBlue/20 border-brandBlue"
                            : "bg-brandNavyDark border-transparent hover:bg-brandNavy"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-brandBlueLight" />
                        <p className="font-medium text-brandBlueLight">
                          {format(new Date(entry.entry_date || entry.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>

                      {entry.wins && (
                        <p className="text-xs text-brandBlueLight/70 line-clamp-2">{entry.wins}</p>
                      )}

                      <div className="mt-1 text-xs">{getMoodDisplay(entry.mood)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1">
          <Card className="bg-brandNavy border border-brandBlue h-full rounded-xl shadow-lg flex flex-col">
            {/* HEADER */}
            <CardHeader className="border-b border-brandBlue/40">
              <CardTitle className="flex items-center justify-between text-brandBlueLight">
                <span>
                  {showNewEntry
                    ? "New Journal Entry"
                    : selectedEntry
                    ? "Entry Details"
                    : "Your Journal"}
                </span>

                {/* AI BUTTONS */}
                {showNewEntry || selectedEntry ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-brandBlue/30 hover:bg-brandBlue text-white flex items-center gap-1"
                      onClick={() => runAI("weekly_recap")}
                    >
                      <Timer className="h-4 w-4" /> Weekly Recap
                    </Button>

                    <Button
                      size="sm"
                      className="bg-brandBlue/30 hover:bg-brandBlue text-white flex items-center gap-1"
                      onClick={() => runAI("monthly_recap")}
                    >
                      <Calendar className="h-4 w-4" /> Monthly Recap
                    </Button>

                    <Button
                      size="sm"
                      className="bg-brandBlue/30 hover:bg-brandBlue text-white flex items-center gap-1"
                      onClick={() => runAI("weekly_roadmap")}
                    >
                      <Brain className="h-4 w-4" /> Weekly Roadmap
                    </Button>
                  </div>
                ) : null}
              </CardTitle>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* AI RESPONSE PANEL */}
              {aiLoading && (
                <div className="p-4 bg-brandNavyDark/60 border border-brandBlue rounded-xl">
                  <Loader2 className="h-5 w-5 animate-spin text-brandBlueLight" />
                </div>
              )}

              {aiResponse && (
                <div className="p-4 bg-brandNavyDark/60 border border-brandBlue rounded-xl whitespace-pre-wrap">
                  <h3 className="text-brandBlueLight font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brandOrange" /> Prospra AI Insights
                  </h3>
                  <p className="text-sm text-brandBlueLight/80">{aiResponse}</p>
                </div>
              )}

              {/* NEW ENTRY EDITOR */}
              {showNewEntry ? (
                <div className="space-y-6">
                  {/* Mood Picker */}
                  <div>
                    <Label className="text-sm text-brandBlueLight">How are you feeling today?</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {MOODS.map((mood) => {
                        const Icon = mood.icon;
                        const active = formData.mood === mood.value;
                        return (
                          <button
                            key={mood.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                mood:
                                  prev.mood === mood.value
                                    ? ""
                                    : (mood.value as MoodValue),
                              }))
                            }
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all
                              ${
                                active
                                  ? "bg-brandBlue/30 border-brandBlue"
                                  : "bg-brandNavyDark border-brandBlue/40 hover:bg-brandNavy"
                              }`}
                          >
                            <Icon className={`h-4 w-4 ${mood.color}`} />
                            <span>{mood.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* PROGRESS NOTES */}
                  <div>
                    <Label className="text-sm text-brandBlueLight">What did you work on today?</Label>
                    <Textarea
                      className="bg-brandNavyDark border-brandBlue text-brandBlueLight h-32 resize-none overflow-y-auto"
                      value={formData.progressNotes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          progressNotes: e.target.value,
                        }))
                      }
                      placeholder="What did you build, learn, or move forward today?"
                    />
                  </div>

                  {/* CHALLENGES */}
                  <div>
                    <Label className="text-sm text-brandBlueLight">What felt challenging?</Label>
                    <Textarea
                      className="bg-brandNavyDark border-brandBlue text-brandBlueLight h-28 resize-none overflow-y-auto"
                      value={formData.challenges}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          challenges: e.target.value,
                        }))
                      }
                      placeholder="Any blockers or frustrations?"
                    />
                  </div>

                  {/* WINS */}
                  <div>
                    <Label className="text-sm text-brandBlueLight">What are you proud of today?</Label>
                    <Textarea
                      className="bg-brandNavyDark border-brandBlue text-brandBlueLight h-28 resize-none overflow-y-auto"
                      value={formData.wins}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wins: e.target.value,
                        }))
                      }
                      placeholder="Even tiny wins count — write them down."
                    />
                  </div>
                </div>
              ) : selectedEntry ? (
                <>
                  <div>{getMoodDisplay(selectedEntry.mood)}</div>
                  {selectedEntry.progress_notes && (
                    <section>
                      <h3 className="text-sm font-semibold text-brandBlueLight">Progress</h3>
                      <p className="text-sm text-brandBlueLight/80 whitespace-pre-wrap">
                        {selectedEntry.progress_notes}
                      </p>
                    </section>
                  )}
                  {selectedEntry.challenges && (
                    <section>
                      <h3 className="text-sm font-semibold text-brandBlueLight">Challenges</h3>
                      <p className="text-sm text-brandBlueLight/80 whitespace-pre-wrap">
                        {selectedEntry.challenges}
                      </p>
                    </section>
                  )}
                  {selectedEntry.wins && (
                    <section>
                      <h3 className="text-sm font-semibold text-brandBlueLight">Wins</h3>
                      <p className="text-sm text-brandBlueLight/80 whitespace-pre-wrap">
                        {selectedEntry.wins}
                      </p>
                    </section>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-brandBlueLight/70">
                  <BookOpen className="h-12 w-12 mb-4 text-brandBlueLight" />
                  <p className="text-sm">Your journal is where Prospra tracks your story.</p>
                  <p className="text-xs mb-4">Start documenting your entrepreneurial journey.</p>
                  <Button
                    onClick={handleNewEntry}
                    className="bg-brandOrange hover:bg-brandOrangeLight text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start a new entry
                  </Button>
                </div>
              )}
            </CardContent>

            {/* FOOTER */}
            {showNewEntry && (
              <div className="border-t border-brandBlue/40 px-6 py-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="border-brandBlue text-brandBlueLight bg-brandNavy"
                  onClick={() => {
                    setShowNewEntry(false);
                    setFormData(defaultFormData);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>

                <Button
                  className="bg-brandOrange hover:bg-brandOrangeLight text-white"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Entry"
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
