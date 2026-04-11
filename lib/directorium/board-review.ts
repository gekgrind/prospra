import { DIRECTORIUM_ROLES, type DirectoriumRoleId } from "@/lib/directorium/roles";

export type BoardReviewRoleOutput = {
  roleId: DirectoriumRoleId;
  roleName: string;
  analysis: string;
  recommendations: string[];
};

export type BoardReviewOutput = {
  synthesis: string;
  roles: BoardReviewRoleOutput[];
};

export function buildBoardReviewPrompt(args: {
  founderContext: string;
  memoryContext: string;
  actionPlanContext: string;
  conversationContext: string;
}) {
  const roleSpec = DIRECTORIUM_ROLES.map(
    (role) =>
      `- ${role.id} (${role.displayName}): ${role.description}\n  Instruction: ${role.instruction}`
  ).join("\n");

  return `You are Directorium Board Review, a premium multi-perspective advisory board for founders.
Return VALID JSON only with this exact shape:
{
  "synthesis": "string",
  "roles": [
    {
      "roleId": "strategist|operator|growth-architect|risk-analyst|contrarian",
      "roleName": "string",
      "analysis": "string",
      "recommendations": ["string", "string"]
    }
  ]
}

Rules:
- Cover each required role exactly once.
- Keep each analysis specific, non-redundant, and founder-practical.
- Recommendations should be concrete, short, and actionable.
- If context is missing, state assumptions explicitly.

Required roles:
${roleSpec}

Founder context:
${args.founderContext}

Memory context:
${args.memoryContext}

Existing action plan context:
${args.actionPlanContext}

Conversation context:
${args.conversationContext}`;
}

export function safeParseBoardReview(raw: string): BoardReviewOutput | null {
  try {
    const trimmed = raw.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end < 0 || end <= start) return null;

    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.roles) || typeof parsed.synthesis !== "string") return null;

    const roles = parsed.roles
      .map((item: unknown) => {
        const typed = (item ?? {}) as Record<string, unknown>;
        return {
        roleId: typed.roleId,
        roleName: typed.roleName,
        analysis: typed.analysis,
        recommendations: Array.isArray(typed.recommendations)
          ? typed.recommendations.filter((rec: unknown) => typeof rec === "string")
          : [],
      };
      })
      .filter(
        (item: { roleId: unknown; roleName: unknown; analysis: unknown }) =>
          typeof item.roleId === "string" &&
          typeof item.roleName === "string" &&
          typeof item.analysis === "string"
      );

    if (roles.length === 0) return null;

    return {
      synthesis: parsed.synthesis,
      roles,
    };
  } catch {
    return null;
  }
}

export function serializeBoardReviewMessage(output: BoardReviewOutput) {
  return `## Directorium Board Review\n\n${output.synthesis}\n\n\`\`\`board-review\n${JSON.stringify(
    output,
    null,
    2
  )}\n\`\`\``;
}
