import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { MentorMarkdown } from "@/components/mentor/MentorMarkdown";

describe("MentorMarkdown", () => {
  it("turns the mentor's bold section lines into labels and keeps line breaks", () => {
    const { container } = render(
      <MentorMarkdown
        content={"**Mentor Insight**\nFocus on one channel.\nThen measure.\n\n**Action Steps**\n1. Do it"}
      />
    );

    const labels = [...container.querySelectorAll("h5")].map((h) => h.textContent);
    expect(labels).toEqual(["Mentor Insight", "Action Steps"]);
    expect(container.querySelector("p")?.innerHTML).toContain("<br>");
    expect(container.querySelectorAll("ol li")).toHaveLength(1);
  });

  it("leaves inline bold and code blocks alone", () => {
    const { container } = render(
      <MentorMarkdown content={"Price at **$450** today.\n\n```\nline one\nline two\n```"} />
    );

    expect(container.querySelector("h5")).toBeNull();
    expect(container.querySelector("strong")).toHaveTextContent("$450");
    expect(container.querySelector("pre code")?.textContent).toBe("line one\nline two\n");
  });
});
