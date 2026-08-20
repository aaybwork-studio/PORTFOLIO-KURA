import { NextResponse } from "next/server";

import { briefLines, briefSubject, isValidEmail, type BriefAnswers, type Currency } from "@/lib/brief";

/*
 * Receive a brief and email it.
 *
 * The only route on this site that accepts input from the internet, so it
 * treats everything in the body as hostile: nothing is trusted for its type,
 * nothing is trusted for its length, and nothing reaches the email as markup.
 *
 * It also fails loudly to the sender only when the sender can fix it. A bad
 * email address is their problem and they are told; a missing API key is mine
 * and they get a generic failure, because "RESEND_API_KEY is not set" on a
 * public endpoint tells an attacker how the thing is wired.
 */

export const runtime = "nodejs";
/* Nothing here is cacheable, and a cached POST would be a silent data loss. */
export const dynamic = "force-dynamic";

/* Longest a field is allowed to be. Past this it is not a brief, it is a payload. */
const LIMITS: Record<string, number> = {
  what: 400,
  extra: 4000,
  name: 120,
  email: 254,
  link: 500,
  budget: 60,
  stage: 60,
  timing: 60,
  needOther: 120,
};

/*
 * Rate limit, per instance, in memory.
 *
 * Deliberately modest: serverless means several instances and a cold start
 * wipes this, so it is a speed bump against a script hammering one instance,
 * not a security control. The honeypot does the real work. Anything stronger
 * needs a shared store, which is not worth adding for a contact form.
 */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  HITS.set(ip, recent);
  if (HITS.size > 500) HITS.clear();
  return recent.length > MAX_PER_WINDOW;
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Escape before anything reaches the HTML email. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many submissions. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read that." }, { status: 400 });
  }
  const raw = (body ?? {}) as Record<string, unknown>;

  /*
   * Honeypot: a hidden field no human is shown. Anything in it means a bot
   * filled every input on the page. Answer 200 rather than 400 — a bot told it
   * failed simply tries again, while one told it succeeded goes away.
   */
  if (str(raw.company, 100).length > 0) {
    return NextResponse.json({ ok: true });
  }

  const currency = (["USD", "INR", "EUR"] as Currency[]).includes(raw.currency as Currency)
    ? (raw.currency as Currency)
    : "USD";

  const answers: BriefAnswers = {
    need: Array.isArray(raw.need)
      ? raw.need.filter((v): v is string => typeof v === "string").slice(0, 10).map((v) => v.slice(0, 60))
      : [],
    needOther: str(raw.needOther, LIMITS.needOther),
    what: str(raw.what, LIMITS.what),
    stage: str(raw.stage, LIMITS.stage),
    timing: str(raw.timing, LIMITS.timing),
    currency,
    budget: str(raw.budget, LIMITS.budget),
    extra: str(raw.extra, LIMITS.extra),
    name: str(raw.name, LIMITS.name),
    email: str(raw.email, LIMITS.email),
    link: str(raw.link, LIMITS.link),
  };

  if (!answers.name) {
    return NextResponse.json({ ok: false, error: "A name, so I know who I am replying to." }, { status: 400 });
  }
  if (!isValidEmail(answers.email)) {
    return NextResponse.json({ ok: false, error: "That email does not look right." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BRIEF_TO_EMAIL;
  /*
   * The sender defaults to Resend's own address, not to this domain.
   *
   * Resend refuses to send from a domain it has not verified — a 403 with the
   * key perfectly valid — so defaulting to brief@aayushbhandari.com meant the
   * form could not work until the DNS records had propagated, and the failure
   * looked identical to a missing key. `onboarding@resend.dev` works the moment
   * an account exists, with one restriction: it can only deliver to the address
   * the Resend account was created with.
   *
   * Set BRIEF_FROM_EMAIL to something on the real domain once it is verified.
   * Briefs then arrive from the site rather than from a shared sandbox address,
   * which is the difference between the inbox and the spam folder.
   */
  const from = process.env.BRIEF_FROM_EMAIL || "Kura Brief <onboarding@resend.dev>";
  if (!apiKey || !to) {
    console.error("[brief] not configured", { hasKey: Boolean(apiKey), hasTo: Boolean(to) });
    return NextResponse.json(
      {
        ok: false,
        error: "Could not send that. Email me directly and I will pick it up.",
        // Distinguishes "the owner has not finished setup" from "the provider
        // said no" without naming either the key or the domain. Enough to
        // diagnose from the browser; nothing an attacker can use.
        code: "not_configured",
      },
      { status: 500 },
    );
  }

  const lines = briefLines(answers);
  const text = lines.map(([k, v]) => `${k}\n${v}`).join("\n\n");
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#14141a">
${lines
  .map(
    ([k, v]) =>
      `<p style="margin:0 0 18px"><strong style="display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b78;margin-bottom:4px">${esc(
        k,
      )}</strong>${esc(v).replace(/\n/g, "<br>")}</p>`,
  )
  .join("\n")}
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [to],
        // So hitting reply in the mail client goes to them, not to the sender
        // address the brief was posted from.
        reply_to: answers.email,
        subject: briefSubject(answers),
        text,
        html,
      }),
    });

    if (!res.ok) {
      // Resend's own message, logged but never returned — it can name the
      // sending domain and the key's state.
      const detail = await res.text().catch(() => "");
      console.error("[brief] resend rejected", res.status, detail);
      return NextResponse.json(
        {
          ok: false,
          error: "Could not send that. Email me directly and I will pick it up.",
          code: "provider_rejected",
        },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[brief] send failed", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not send that. Email me directly and I will pick it up.",
        code: "network",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
