import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MentorComposer } from "@/components/mentor/MentorComposer";

function Harness(props: { onSubmit: () => void; isBusy?: boolean; onStop?: () => void }) {
  const [value, setValue] = useState("");
  return <MentorComposer value={value} onChange={setValue} {...props} />;
}

describe("MentorComposer", () => {
  it("sends on Enter and inserts a newline on Shift+Enter", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const box = screen.getByLabelText("Message your mentor");

    await userEvent.type(box, "Line one{Shift>}{Enter}{/Shift}Line two");
    expect(box).toHaveValue("Line one\nLine two");
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(box, "{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not send empty or whitespace-only messages", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Message your mentor"), "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks sending but keeps typing enabled while the mentor responds, and offers stop", async () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    render(<Harness onSubmit={onSubmit} isBusy onStop={onStop} />);
    const box = screen.getByLabelText("Message your mentor");

    await userEvent.type(box, "Next question{Enter}");
    expect(box).toHaveValue("Next question");
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Stop the mentor's response" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("exposes an actions slot for future controls such as voice input", () => {
    render(
      <MentorComposer
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        actions={<button type="button">Voice</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Voice" })).toBeInTheDocument();
  });
});
