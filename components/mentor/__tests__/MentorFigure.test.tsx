import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { MentorAvatar, MentorFigure } from "@/components/mentor/MentorFigure";

function mockReducedMotion(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("reduce") ? matches : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MentorFigure", () => {
  it("renders the state asset inside a fixed, decorative box", () => {
    const { container } = render(<MentorFigure state="thinking" size={180} />);
    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.style.width).toBe("180px");
    expect(root.className).toContain("aspect-square");
    const img = root.querySelector("img");
    expect(img).toHaveAttribute("src", "/mentor/prospra-mentor-thinking.png");
    expect(img).toHaveAttribute("alt", "");
  });

  it("reports reduced motion so animation is minimised", () => {
    mockReducedMotion(true);
    const { container } = render(<MentorFigure state="idle" size={120} float />);
    expect(container.firstElementChild).toHaveAttribute("data-reduced-motion", "true");
  });

  it("only floats under motion-safe", () => {
    mockReducedMotion(false);
    const { container } = render(<MentorFigure state="idle" size={120} float />);
    const floating = container.querySelector('[class*="mentor-float"]');
    expect(floating?.className).toMatch(/motion-safe:animate-\[mentor-float/);
  });

  it("uses the portrait crop for avatars", () => {
    const { container } = render(<MentorAvatar state="explaining" />);
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/mentor/prospra-mentor-explaining-portrait.png"
    );
  });
});
