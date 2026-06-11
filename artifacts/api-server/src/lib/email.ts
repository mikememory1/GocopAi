import { Resend } from "resend";
import { logger } from "./logger";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

interface QuizEmailPayload {
  to: string;
  name: string | null;
  stage: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  generatedPlan: string | null;
}

interface ParsedPlan {
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  sections?: { title: string; priority: string; actions: string[] }[];
}

function parsePlan(raw: string | null): ParsedPlan | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedPlan;
  } catch {
    return null;
  }
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

function buildScoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function buildHtml(payload: QuizEmailPayload): string {
  const { name, stage, overallScore, categoryScores, generatedPlan } = payload;
  const plan = parsePlan(generatedPlan);
  const greeting = name ? `Hey ${name},` : "Hey there,";

  const catRows = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, score]) => {
      const label = cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
      return `
        <tr>
          <td style="padding:8px 12px;color:#a1a1aa;font-size:13px;">${label}</td>
          <td style="padding:8px 12px;font-family:monospace;font-size:13px;color:${color};">${buildScoreBar(score)}</td>
          <td style="padding:8px 12px;font-family:monospace;font-size:14px;font-weight:bold;color:${color};text-align:right;">${score}/100</td>
        </tr>`;
    })
    .join("");

  const planHtml = plan
    ? `
      ${plan.summary ? `<p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 24px 0;">${plan.summary}</p>` : ""}

      ${
        plan.strengths?.length
          ? `<div style="margin-bottom:20px;">
              <p style="font-size:13px;font-weight:600;color:#22c55e;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px 0;">Strengths</p>
              <ul style="margin:0;padding-left:20px;color:#a1a1aa;font-size:13px;line-height:1.8;">
                ${plan.strengths.map((s) => `<li>${s}</li>`).join("")}
              </ul>
            </div>`
          : ""
      }

      ${
        plan.weaknesses?.length
          ? `<div style="margin-bottom:24px;">
              <p style="font-size:13px;font-weight:600;color:#ef4444;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px 0;">Areas to Improve</p>
              <ul style="margin:0;padding-left:20px;color:#a1a1aa;font-size:13px;line-height:1.8;">
                ${plan.weaknesses.map((w) => `<li>${w}</li>`).join("")}
              </ul>
            </div>`
          : ""
      }

      ${
        plan.sections?.length
          ? plan.sections
              .map(
                (sec) => `
                <div style="margin-bottom:20px;border-left:3px solid ${PRIORITY_COLOR[sec.priority] ?? "#3b82f6"};padding-left:14px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <p style="font-size:14px;font-weight:700;color:#f4f4f5;margin:0;">${sec.title}</p>
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:${PRIORITY_COLOR[sec.priority] ?? "#3b82f6"};">${sec.priority}</span>
                  </div>
                  <ul style="margin:0;padding-left:16px;color:#a1a1aa;font-size:13px;line-height:1.8;">
                    ${sec.actions.map((a) => `<li>${a}</li>`).join("")}
                  </ul>
                </div>`,
              )
              .join("")
          : ""
      }
    `
    : generatedPlan
      ? `<p style="color:#a1a1aa;font-size:13px;white-space:pre-wrap;line-height:1.7;">${generatedPlan}</p>`
      : "";

  const stageColor = overallScore >= 70 ? "#22c55e" : overallScore >= 40 ? "#f59e0b" : "#3b82f6";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Business Maturity Audit Results</title></head>
<body style="margin:0;padding:0;background:#09090b;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-family:monospace;font-size:20px;font-weight:700;color:#3b82f6;letter-spacing:-0.02em;">GoCopyAI</p>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:#111113;border:1px solid #27272a;border-radius:8px;padding:32px;margin-bottom:24px;">
          <p style="margin:0 0 6px 0;font-size:13px;font-family:monospace;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Analysis Complete</p>
          <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#f4f4f5;letter-spacing:-0.02em;">${greeting}</h1>
          <p style="margin:0 0 24px 0;color:#a1a1aa;font-size:15px;line-height:1.6;">Your Business Maturity Audit is complete. Here are your results and personalised action plan.</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#18181b;border:1px solid #27272a;border-radius:6px;padding:20px;width:48%;">
                <p style="margin:0 0 4px 0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;">Maturity Stage</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#f4f4f5;">${stage}</p>
              </td>
              <td width="16"></td>
              <td style="background:#18181b;border:1px solid #27272a;border-radius:6px;padding:20px;width:48%;">
                <p style="margin:0 0 4px 0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;">Overall Score</p>
                <p style="margin:0;font-size:32px;font-weight:800;font-family:monospace;color:${stageColor};">${overallScore}<span style="font-size:16px;color:#71717a;">/100</span></p>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td height="16"></td></tr>

        <!-- Category scores -->
        <tr><td style="background:#111113;border:1px solid #27272a;border-radius:8px;padding:32px;">
          <p style="margin:0 0 16px 0;font-size:13px;font-family:monospace;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">Category Breakdown</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${catRows}
          </table>
        </td></tr>

        <tr><td height="16"></td></tr>

        <!-- Action plan -->
        ${
          planHtml
            ? `<tr><td style="background:#111113;border:1px solid #27272a;border-radius:8px;padding:32px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
                  <p style="margin:0;font-size:13px;font-family:monospace;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;">AI Action Plan</p>
                  <span style="font-size:11px;background:#3b82f6;color:#fff;padding:2px 8px;border-radius:9999px;font-weight:600;">AI Generated</span>
                </div>
                ${planHtml}
              </td></tr>
              <tr><td height="16"></td></tr>`
            : ""
        }

        <!-- CTA -->
        <tr><td style="text-align:center;padding:8px 0 32px 0;">
          <a href="https://gocopyai.com/app" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:6px;letter-spacing:-0.01em;">Go to Your Dashboard →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="text-align:center;border-top:1px solid #27272a;padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} GoCopyAI. You're receiving this because you completed a Business Maturity Audit.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendQuizResultEmail(payload: QuizEmailPayload): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.debug("RESEND_API_KEY not set, skipping quiz result email");
    return;
  }

  const subject = `Your Business Maturity Score: ${payload.overallScore}/100 — ${payload.stage}`;

  try {
    const { error } = await client.emails.send({
      from: "GoCopyAI <results@gocopyai.com>",
      to: payload.to,
      subject,
      html: buildHtml(payload),
    });

    if (error) {
      logger.warn({ error }, "Resend API returned an error sending quiz result email");
    } else {
      logger.info({ to: payload.to, stage: payload.stage }, "Quiz result email sent");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to send quiz result email");
  }
}
