export type OnboardingQuestionType = "single_select" | "multi_select" | "text" | "long_text";

export type OnboardingQuestion = {
  id: string;
  prompt: string;
  description?: string;
  type: OnboardingQuestionType;
  required?: boolean;
  options?: string[];
  allowOther?: boolean;
  placeholder?: string;
  condition?: {
    questionId: string;
    equals?: string;
    includes?: string;
  };
};

export type OnboardingSection = {
  id: string;
  title: string;
  subtitle: string;
  questions: OnboardingQuestion[];
};

export const ONBOARDING_SECTIONS: OnboardingSection[] = [
  {
    id: "founder_identity",
    title: "Founder identity",
    subtitle: "Let us personalize mentorship to how you actually build.",
    questions: [
      {
        id: "founder_name",
        prompt: "What should Prospra call you?",
        type: "text",
        required: true,
        placeholder: "Your first name, nickname, or founder alias",
      },
      {
        id: "founder_role",
        prompt: "What role do you currently hold?",
        type: "text",
        placeholder: "Founder, solo operator, CEO, creator...",
      },
    ],
  },
  {
    id: "venture_snapshot",
    title: "Venture snapshot",
    subtitle: "A clear baseline helps us tailor strategy to your stage.",
    questions: [
      {
        id: "industry",
        prompt: "Which industry best describes your venture?",
        type: "single_select",
        required: true,
        allowOther: true,
        options: ["SaaS", "E-commerce", "Services", "Education", "Content/Media", "Health/Wellness"],
      },
      {
        id: "stage",
        prompt: "Where are you right now?",
        type: "single_select",
        required: true,
        options: ["Idea", "Pre-launch", "Early traction", "Scaling"],
      },
      {
        id: "business_model",
        prompt: "How do you primarily monetize?",
        type: "multi_select",
        allowOther: true,
        options: ["Subscriptions", "One-time products", "Services", "Cohorts/Courses", "Affiliate/Partnerships"],
      },
    ],
  },
  {
    id: "website_presence",
    title: "Website presence",
    subtitle: "If a site exists, we can analyze it to sharpen mentorship.",
    questions: [
      {
        id: "has_website",
        prompt: "Do you already have a live website?",
        type: "single_select",
        required: true,
        options: ["yes", "no"],
      },
      {
        id: "website_url",
        prompt: "What is the website URL?",
        description: "Include https:// for best results.",
        type: "text",
        required: true,
        placeholder: "https://yourbrand.com",
        condition: {
          questionId: "has_website",
          equals: "yes",
        },
      },
      {
        id: "website_priority",
        prompt: "What should we focus on first in your website analysis?",
        type: "single_select",
        allowOther: true,
        options: ["Messaging clarity", "Conversion flow", "Offer positioning", "Trust signals"],
        condition: {
          questionId: "has_website",
          equals: "yes",
        },
      },
    ],
  },
  {
    id: "audience_customer",
    title: "Audience & customer",
    subtitle: "Great mentorship starts with who you serve and why they buy.",
    questions: [
      {
        id: "target_audience",
        prompt: "Who is your core audience?",
        type: "long_text",
        required: true,
        placeholder: "Describe your ideal customer in plain language.",
      },
      {
        id: "customer_pain",
        prompt: "What painful problem are they trying to solve?",
        type: "long_text",
        required: true,
      },
    ],
  },
  {
    id: "offer_positioning",
    title: "Offer positioning",
    subtitle: "We use this to improve value communication and conversion quality.",
    questions: [
      {
        id: "offer_summary",
        prompt: "What exactly are you offering today?",
        type: "long_text",
        required: true,
      },
      {
        id: "core_differentiator",
        prompt: "What makes your offer different or better?",
        type: "long_text",
        required: true,
      },
    ],
  },
  {
    id: "growth_goals",
    title: "Growth goals",
    subtitle: "Your next 90 days become the center of your action plan.",
    questions: [
      {
        id: "goal_90_day",
        prompt: "What is your #1 outcome over the next 90 days?",
        type: "long_text",
        required: true,
      },
      {
        id: "goal_success_metric",
        prompt: "How will you know you've succeeded?",
        type: "text",
        required: true,
        placeholder: "e.g. $10k MRR, 20 paying clients, 15% conversion",
      },
    ],
  },
  {
    id: "acquisition_sales",
    title: "Acquisition & sales",
    subtitle: "This helps us target bottlenecks in growth and conversion.",
    questions: [
      {
        id: "current_channels",
        prompt: "Which channels are you actively using?",
        type: "multi_select",
        required: true,
        allowOther: true,
        options: ["Organic social", "Paid ads", "Email", "Referrals", "Outbound", "Community"],
      },
      {
        id: "sales_confidence",
        prompt: "How confident are you in your sales process today?",
        type: "single_select",
        required: true,
        options: ["Very confident", "Somewhat confident", "Low confidence", "I don't have one yet"],
      },
    ],
  },
  {
    id: "operations_mindset",
    title: "Operations & mindset",
    subtitle: "Mentorship quality improves when we know your real constraints.",
    questions: [
      {
        id: "biggest_challenge",
        prompt: "What's the single biggest thing slowing growth right now?",
        type: "long_text",
        required: true,
      },
      {
        id: "weekly_capacity",
        prompt: "How many hours per week can you reliably invest?",
        type: "single_select",
        required: true,
        options: ["< 5", "5-10", "10-20", "20+"],
      },
      {
        id: "support_preference",
        prompt: "What support style helps you execute best?",
        type: "multi_select",
        allowOther: true,
        options: ["High accountability", "Strategic sparring", "Tactical templates", "Weekly planning support"],
      },
    ],
  },
  {
    id: "mentorship_preferences",
    title: "Mentorship preferences",
    subtitle: "Final tuning so guidance feels personal and immediately useful.",
    questions: [
      {
        id: "mentor_tone",
        prompt: "What coaching tone do you prefer?",
        type: "single_select",
        required: true,
        options: ["Direct and challenging", "Balanced and practical", "Supportive and encouraging"],
      },
      {
        id: "communication_preference",
        prompt: "How do you like insights delivered?",
        type: "multi_select",
        allowOther: true,
        options: ["Short action lists", "Deep strategic reasoning", "Examples and rewrites", "Step-by-step plans"],
      },
      {
        id: "additional_context",
        prompt: "Anything else your mentor should know?",
        type: "long_text",
      },
    ],
  },
];
