"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MdNode = {
  type: string;
  value?: string;
  depth?: number;
  children?: MdNode[];
};

/**
 * Mentor replies use a "**Section**" line followed by text (see the mentor
 * system prompt). In Markdown those collapse into one paragraph, so:
 *  - a bold run that opens a top-level paragraph on its own line becomes a
 *    section label, and
 *  - remaining single newlines render as line breaks (as the old pre-wrap UI did).
 */
function remarkMentorStructure() {
  const LEADING_LINE_END = /^:?[ \t]*\n/;

  const splitLeadingBold = (paragraph: MdNode): MdNode[] => {
    const [first, second, ...rest] = paragraph.children ?? [];
    const opensWithBoldLine =
      first?.type === "strong" &&
      (!second || (second.type === "text" && LEADING_LINE_END.test(second.value ?? "")));
    if (!opensWithBoldLine) return [paragraph];

    const heading: MdNode = { type: "heading", depth: 4, children: first.children };
    if (!second) return [heading];

    const remainder = [
      { ...second, value: (second.value ?? "").replace(LEADING_LINE_END, "") },
      ...rest,
    ].filter((node) => node.type !== "text" || node.value);
    return remainder.length ? [heading, { ...paragraph, children: remainder }] : [heading];
  };

  const addBreaks = (node: MdNode) => {
    if (!node.children) return;
    node.children = node.children.flatMap((child): MdNode[] => {
      if (child.type !== "text" || !child.value?.includes("\n")) {
        addBreaks(child);
        return [child];
      }
      return child.value.split("\n").flatMap((part, index): MdNode[] =>
        index === 0
          ? [{ type: "text", value: part }]
          : [{ type: "break" }, { type: "text", value: part }]
      );
    });
  };

  return (tree: MdNode) => {
    tree.children = (tree.children ?? []).flatMap((node) =>
      node.type === "paragraph" ? splitLeadingBold(node) : [node]
    );
    addBreaks(tree);
  };
}

const components: Components = {
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h3 className="mb-2 mt-6 text-[17px] font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-6 text-[16px] font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-5 text-[15px] font-semibold text-white first:mt-0">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="mb-1.5 mt-5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#7fd9f5] first:mt-0 [&_strong]:font-semibold [&_strong]:text-inherit">
      {children}
    </h5>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="text-[#dcebf8]">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pl-5 marker:text-[#00d4ff]/70 [list-style-type:disc]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 space-y-1.5 pl-5 marker:font-medium marker:text-[#8fc9e6] [list-style-type:decimal]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[#6fdcff] underline decoration-[#00d4ff]/35 underline-offset-[3px] transition hover:decoration-[#00d4ff]"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-[#00d4ff]/45 pl-4 text-[#cfe0ef]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-white/10" />,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return <code className={cn("font-mono text-[13px]", className)}>{children}</code>;
    }
    return (
      <code className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.86em] text-[#d8f3ff]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-[#030b16] p-4 text-[13px] leading-relaxed text-[#d8e8f7]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full border-collapse text-left text-[14px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-white/10 bg-white/[0.04] px-3 py-2 font-semibold text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-white/[0.06] px-3 py-2 align-top">{children}</td>
  ),
};

/** Renders Mentor replies (markdown + GFM) with Prospra reading typography. */
export const MentorMarkdown = memo(function MentorMarkdown({
  content,
}: {
  content: string;
}) {
  return (
    <div className="break-words text-[15px] leading-7 text-[#dbe7f3]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMentorStructure]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
