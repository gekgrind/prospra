export type FounderFuelOutputType =
  | "Marketing"
  | "Strategy"
  | "Validation"
  | "Content"
  | "Research"
  | "Other";

export type FounderFuelTone =
  | "Direct"
  | "Professional"
  | "Bold"
  | "Conversational";

export type FounderFuelTemplate = {
  id: string;
  title: string;
  description: string;
  defaultGoal: string;
  defaultOutputType: FounderFuelOutputType;
  goalHint: string;
};

export const founderFuelTemplates: FounderFuelTemplate[] = [
  {
    id: "marketing-campaign",
    title: "Marketing Campaign",
    description: "Craft campaign messaging and execution that drives qualified demand.",
    defaultGoal: "Build a focused campaign concept that can drive high-intent leads in the next 30 days.",
    defaultOutputType: "Marketing",
    goalHint: "Include channel, timeline, and conversion target.",
  },
  {
    id: "offer-positioning",
    title: "Offer Positioning",
    description: "Clarify your value proposition so your offer lands instantly.",
    defaultGoal: "Sharpen positioning so prospects quickly understand why this offer is the right choice.",
    defaultOutputType: "Strategy",
    goalHint: "Mention unique advantage, pain points solved, and desired outcome.",
  },
  {
    id: "audience-research",
    title: "Audience Research",
    description: "Define audience insights, objections, and decision drivers.",
    defaultGoal: "Identify audience segments, top objections, and message angles most likely to convert.",
    defaultOutputType: "Research",
    goalHint: "Include buyer stage, demographics, and decision context.",
  },
  {
    id: "content-strategy",
    title: "Content Strategy",
    description: "Generate strategic content plans that support business growth.",
    defaultGoal: "Create a practical content strategy that moves the audience from awareness to action.",
    defaultOutputType: "Content",
    goalHint: "Specify content channels, cadence, and funnel stage.",
  },
  {
    id: "validation",
    title: "Validation",
    description: "Pressure-test assumptions before investing deeply in execution.",
    defaultGoal: "Design a lean validation plan to test demand and reduce product-market risk quickly.",
    defaultOutputType: "Validation",
    goalHint: "Describe assumptions to test and what proof would count as success.",
  },
  {
    id: "growth-ideas",
    title: "Growth Ideas",
    description: "Explore strategic growth plays tailored to current business stage.",
    defaultGoal: "Generate prioritized growth opportunities suitable for our current stage and resources.",
    defaultOutputType: "Strategy",
    goalHint: "Mention constraints, team size, and current traction.",
  },
];

export const founderFuelToneOptions: FounderFuelTone[] = [
  "Direct",
  "Professional",
  "Bold",
  "Conversational",
];

export const founderFuelOutputTypeOptions: FounderFuelOutputType[] = [
  "Marketing",
  "Strategy",
  "Validation",
  "Content",
  "Research",
  "Other",
];

export type FounderFuelFormValues = {
  businessIdea: string;
  targetAudience: string;
  goal: string;
  toneStyle: FounderFuelTone;
  outputType: FounderFuelOutputType;
  additionalContext: string;
};

export const defaultFounderFuelFormValues: FounderFuelFormValues = {
  businessIdea: "",
  targetAudience: "",
  goal: "",
  toneStyle: "Professional",
  outputType: "Strategy",
  additionalContext: "",
};
