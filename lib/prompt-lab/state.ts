import { PromptLabAction, PromptLabFormState, initialPromptLabFormState } from "@/lib/prompt-lab/types";

export function promptLabReducer(state: PromptLabFormState, action: PromptLabAction): PromptLabFormState {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      } as PromptLabFormState;
    case "TOGGLE_CHIP": {
      const set = new Set(state[action.field]);
      if (set.has(action.value)) {
        set.delete(action.value);
      } else {
        set.add(action.value);
      }
      return {
        ...state,
        [action.field]: [...set],
      };
    }
    case "RESET":
      return {
        ...initialPromptLabFormState,
        ...(action.payload ?? {}),
      };
    default:
      return state;
  }
}

export function validatePromptLab(state: PromptLabFormState) {
  const errors: Partial<Record<keyof PromptLabFormState, string>> = {};

  if (!state.taskType) errors.taskType = "Choose a task type";
  if (state.taskType === "Other" && !state.taskTypeOther.trim()) errors.taskTypeOther = "Please specify your task";
  if (!state.objective.trim()) errors.objective = "Describe your objective";
  if (!state.deliverable.trim()) errors.deliverable = "Describe the output you want";
  if (!state.audienceType) errors.audienceType = "Select an audience";
  if (state.audienceType === "Other" && !state.audienceTypeOther.trim()) errors.audienceTypeOther = "Please specify your audience";
  if (!state.audienceDetails.trim()) errors.audienceDetails = "Add audience details";
  if (!state.tonePrimary.trim()) errors.tonePrimary = "Set a primary tone";
  if (!state.platform) errors.platform = "Select a platform";

  return errors;
}
