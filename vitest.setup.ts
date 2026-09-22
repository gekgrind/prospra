import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";

afterEach(() => cleanup());

// matchMedia drives prefers-reduced-motion (framer-motion) — default: no preference.
const isDom = typeof window !== "undefined";

if (isDom && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// next/image needs the Next runtime; render a plain <img> in unit tests.
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const rest = { ...props };
    delete rest.fill;
    delete rest.priority;
    delete rest.sizes;
    return createElement("img", rest);
  },
  getImageProps: ({ src, sizes }: { src: string; sizes?: string }) => ({
    props: { src, srcSet: `${src} 1x`, sizes },
  }),
}));

if (isDom) {
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame ??= ((cb: FrameRequestCallback) => window.setTimeout(() => cb(0), 0)) as typeof window.requestAnimationFrame;
}
