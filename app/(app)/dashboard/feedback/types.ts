export type FeedbackAdminItem = {
  id: string;
  user_id: string;
  feedback_type: "bug" | "feature_request" | "general_feedback";
  message: string;
  context: Record<string, unknown> | null;
  status: "new" | "in_review" | "resolved" | "ignored";
  created_at: string;
  updated_at: string;
};
