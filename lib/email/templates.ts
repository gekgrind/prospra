import type { LifecycleEmailTemplatePayload, LifecycleEmailType } from "@/lib/email/types";

type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

function renderLayout(content: { intro: string; body: string; ctaLabel: string; ctaUrl: string; outro?: string }) {
  const outro = content.outro ?? "You can manage email preferences anytime from your Account settings.";

  return {
    text: `${content.intro}\n\n${content.body}\n\n${content.ctaLabel}: ${content.ctaUrl}\n\n${outro}\n\n— Team Prospra`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #e5e7eb; background: #0d1624; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; border: 1px solid rgba(79,124,167,0.35); border-radius: 12px; padding: 24px; background: #11213a;">
          <p style="margin: 0 0 16px 0; color: #f8fafc; line-height: 1.5;">${content.intro}</p>
          <p style="margin: 0 0 20px 0; color: #cbd5e1; line-height: 1.6;">${content.body}</p>
          <a href="${content.ctaUrl}" style="display: inline-block; background: #d27a2c; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
            ${content.ctaLabel}
          </a>
          <p style="margin: 18px 0 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">${outro}</p>
          <p style="margin: 14px 0 0 0; color: #94a3b8; font-size: 13px;">— Team Prospra</p>
        </div>
      </div>
    `.trim(),
  };
}

export function buildLifecycleEmailTemplate(
  type: LifecycleEmailType,
  payload: LifecycleEmailTemplatePayload
): EmailTemplate {
  const firstName = payload.firstName?.trim() ? payload.firstName.trim() : "Founder";

  if (type === "welcome") {
    const intro = `Welcome to Prospra, ${firstName}.`; 
    const body = "You now have a focused space to turn ideas into execution. Start by finishing onboarding, then run your first mentor session so Prospra can tailor guidance to your business.";
    const layout = renderLayout({ intro, body, ctaLabel: payload.ctaLabel, ctaUrl: payload.ctaUrl, outro: "No fluff — just momentum. You can tune non-essential emails in Account settings." });
    return {
      subject: "Welcome to Prospra — let’s build real momentum",
      text: layout.text,
      html: layout.html,
    };
  }

  if (type === "onboarding_reminder") {
    const intro = `${firstName}, your setup is waiting.`;
    const body = "You’re one short onboarding pass away from getting sharper recommendations and founder-specific execution prompts. Finish setup when you’re ready — it should only take a few minutes.";
    const layout = renderLayout({ intro, body, ctaLabel: payload.ctaLabel, ctaUrl: payload.ctaUrl });
    return {
      subject: "Finish setup to unlock your Prospra mentor flow",
      text: layout.text,
      html: layout.html,
    };
  }

  if (type === "weekly_review_ready") {
    const intro = `${firstName}, your weekly review is ready.`;
    const body = payload.summary
      ? `Quick snapshot: ${payload.summary}`
      : "You have enough activity to run a clean weekly recap and choose your top priorities for next week.";
    const layout = renderLayout({ intro, body, ctaLabel: payload.ctaLabel, ctaUrl: payload.ctaUrl });
    return {
      subject: "Your weekly Prospra review is ready",
      text: layout.text,
      html: layout.html,
    };
  }

  const intro = `${firstName}, quick momentum check-in.`;
  const body = payload.triggerDetail
    ? `${payload.triggerDetail} Pick one next action and get back into flow.`
    : "It looks like execution stalled a bit. Re-open your action plan, ship one meaningful task, and rebuild momentum.";
  const layout = renderLayout({ intro, body, ctaLabel: payload.ctaLabel, ctaUrl: payload.ctaUrl });
  return {
    subject: "A practical next step to restart momentum",
    text: layout.text,
    html: layout.html,
  };
}
