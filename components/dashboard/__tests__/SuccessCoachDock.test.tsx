import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SuccessCoachDock } from "@/components/dashboard/SuccessCoachDock";

/** A UI-message SSE stream whose chunks the test releases one at a time. */
function controllableStream() {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  const send = (chunk: unknown) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

  return {
    response: new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "x-vercel-ai-ui-message-stream": "v1" },
    }),
    start: () => {
      send({ type: "start", messageId: "srv-1" });
      send({ type: "start-step" });
      send({ type: "text-start", id: "t1" });
    },
    delta: (text: string) => send({ type: "text-delta", id: "t1", delta: text }),
    finish: () => {
      send({ type: "text-end", id: "t1" });
      send({ type: "finish-step" });
      send({ type: "finish" });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  };
}

type FetchCall = { url: string; body: Record<string, unknown> };
let calls: FetchCall[];
let responder: () => Response;

beforeEach(() => {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return responder();
    })
  );
});

afterEach(() => vi.unstubAllGlobals());

async function openDockAndAsk(text: string) {
  render(<SuccessCoachDock />);
  await userEvent.click(screen.getByRole("button", { name: /Success Coach/ }));
  await userEvent.type(screen.getByLabelText("Message your Success Coach"), `${text}{Enter}`);
}

describe("SuccessCoachDock", () => {
  it("streams the reply progressively from /api/chat without touching Mentor history", async () => {
    const stream = controllableStream();
    responder = () => stream.response;

    await openDockAndAsk("Help me plan my week");

    await waitFor(() => expect(calls).toHaveLength(1));
    const { url, body } = calls[0];
    expect(url).toBe("/api/chat");
    expect(body.mode).toBe("success-coach");
    expect(body).not.toHaveProperty("conversationId");
    const sent = body.messages as Array<{ role: string; parts: Array<{ text: string }> }>;
    expect(sent.some((m) => m.role === "system")).toBe(false);
    expect(sent[sent.length - 1]).toMatchObject({ role: "user", parts: [{ text: "Help me plan my week" }] });

    // Thinking indicator until the first token.
    expect(screen.getByLabelText("Coach is thinking")).toBeInTheDocument();

    await act(async () => {
      stream.start();
      stream.delta("Pick one ");
    });
    expect(await screen.findByText("Pick one")).toBeInTheDocument();
    expect(screen.queryByLabelText("Coach is thinking")).not.toBeInTheDocument();

    await act(async () => {
      stream.delta("goal for Monday.");
      stream.finish();
    });
    expect(await screen.findByText("Pick one goal for Monday.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("blocks duplicate submits while a reply is in flight", async () => {
    const stream = controllableStream();
    responder = () => stream.response;

    await openDockAndAsk("First");
    await userEvent.type(screen.getByLabelText("Message your Success Coach"), "Second{Enter}");

    expect(calls).toHaveLength(1);
    await act(async () => {
      stream.start();
      stream.finish();
    });
  });

  it("shows a friendly error with retry, and never sends the error text back to the model", async () => {
    responder = () =>
      new Response(JSON.stringify({ error: "CHAT_ERROR", message: "internal detail" }), { status: 500 });

    await openDockAndAsk("Will this fail?");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Something glitched on my side");
    expect(alert).not.toHaveTextContent("internal detail");

    const retry = controllableStream();
    responder = () => retry.response;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1].body.trigger).toBe("regenerate-message");
    expect(JSON.stringify(calls[1].body.messages)).not.toContain("glitched");

    await act(async () => {
      retry.start();
      retry.delta("Back on track.");
      retry.finish();
    });
    expect(await screen.findByText("Back on track.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("explains usage limits with an upgrade path", async () => {
    responder = () =>
      new Response(JSON.stringify({ error: "USAGE_LIMIT", message: "You've used today's free prompts." }), {
        status: 429,
      });

    await openDockAndAsk("One more");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("You've used today's free prompts.");
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/upgrade");
  });
});
