/*
 * Build a Brief — the questions, and the shapes they produce.
 *
 * This lives outside the component on purpose: the same definitions are used to
 * render the form in the browser AND to validate and format the submission on
 * the server. A question set that exists in two places drifts, and the half
 * that drifts is always the server's, which is the half that decides whether an
 * enquiry arrives at all.
 */

export type Currency = "USD" | "INR" | "EUR";

export const CURRENCIES: Currency[] = ["USD", "INR", "EUR"];

/*
 * Budget bands per currency.
 *
 * Not conversions of each other. A band is a shape of engagement, and the same
 * shape costs a different number in Delhi and in Berlin — running USD figures
 * through an exchange rate would produce bands that read as arbitrary in both
 * places.
 *
 * The last two options are the point of the question: someone who has not
 * worked it out is still worth talking to, and someone who would rather not say
 * should be able to move on rather than abandon the form.
 */
export const BUDGET_BANDS: Record<Currency, string[]> = {
  USD: ["Under $1k", "$1–5k", "$5–10k", "$10k+", "Not worked out yet", "Rather not say"],
  INR: ["Under ₹50k", "₹50k–2L", "₹2L–5L", "₹5L+", "Not worked out yet", "Rather not say"],
  EUR: ["Under €1k", "€1–5k", "€5–10k", "€10k+", "Not worked out yet", "Rather not say"],
};

export type Question =
  | {
      id: string;
      kind: "choice";
      title: string;
      hint?: string;
      options: string[];
      /** true = pick as many as apply */
      multi?: boolean;
      skippable: boolean;
    }
  | { id: string; kind: "text"; title: string; hint?: string; placeholder: string; skippable: boolean }
  | { id: string; kind: "budget"; title: string; hint?: string; skippable: boolean }
  | { id: string; kind: "contact"; title: string; hint?: string; skippable: false };

/*
 * Seven steps.
 *
 * Ordered so the cheap taps come first and the two that ask for typing come
 * last: someone who has answered four questions with a thumb is far more
 * likely to type than someone asked to write a sentence on the first screen.
 *
 * Every question skips except the last. The last one is the whole point of the
 * exercise — a brief with no way to reply to it is a brief nobody reads.
 */
export const QUESTIONS: Question[] = [
  {
    id: "need",
    kind: "choice",
    title: "What do you need?",
    hint: "Pick as many as apply.",
    options: [
      "Product design",
      "UX research",
      "Interaction design",
      "Graphics & art direction",
      "A website",
      "Not sure yet",
    ],
    multi: true,
    skippable: true,
  },
  {
    id: "what",
    kind: "text",
    title: "What is it?",
    hint: "One line is plenty.",
    placeholder: "A booking flow for a clinic. A brand for a snack company.",
    skippable: true,
  },
  {
    id: "stage",
    kind: "choice",
    title: "Where is it now?",
    options: ["Just an idea", "Being built", "Already live", "Live, but needs a rethink"],
    skippable: true,
  },
  {
    id: "timing",
    kind: "choice",
    title: "When would you want to start?",
    options: ["Ready now", "Next month", "This quarter", "Just looking ahead"],
    skippable: true,
  },
  {
    id: "budget",
    kind: "budget",
    title: "Is there a budget yet?",
    hint: "It only decides the shape of the work, not whether I reply.",
    skippable: true,
  },
  {
    id: "extra",
    kind: "text",
    title: "Anything else?",
    hint: "Links, references, a deadline, who else is involved. Or skip it.",
    placeholder: "",
    skippable: true,
  },
  {
    id: "who",
    kind: "contact",
    title: "And you are?",
    hint: "So there is somewhere to send the reply.",
    skippable: false,
  },
];

export type BriefAnswers = {
  need: string[];
  what: string;
  stage: string;
  timing: string;
  currency: Currency;
  budget: string;
  extra: string;
  name: string;
  email: string;
  link: string;
  /*
   * Honeypot. A real person never sees this field, so anything in it came from
   * something filling every input on the page. Cheaper and quieter than a
   * captcha, and it costs a legitimate visitor nothing.
   */
  company?: string;
};

/*
 * Email validation.
 *
 * Deliberately not one of the thousand-character RFC 5322 regexes. Those accept
 * addresses no mail server will route and reject ones that work, and the real
 * check is whether a reply arrives. This rejects the things people actually
 * mistype — no @, nothing after it, no dot in the domain, stray spaces — and
 * lets the rest through.
 */
export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (v.length < 6 || v.length > 254) return false;
  if (/\s/.test(v)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

const EMPTY = "Skipped";

/** One brief, as lines. Used for the plain-text half of the email. */
export function briefLines(a: BriefAnswers): [string, string][] {
  return [
    ["Needs", a.need.length ? a.need.join(", ") : EMPTY],
    ["What it is", a.what.trim() || EMPTY],
    ["Stage", a.stage || EMPTY],
    ["Timing", a.timing || EMPTY],
    ["Budget", a.budget ? `${a.budget} (${a.currency})` : EMPTY],
    ["Anything else", a.extra.trim() || EMPTY],
    ["Name", a.name.trim()],
    ["Email", a.email.trim()],
    ["Link", a.link.trim() || "—"],
  ];
}

/**
 * A one-line summary for the mail subject, so an inbox list is readable without
 * opening anything: who it is from and what they want.
 */
export function briefSubject(a: BriefAnswers): string {
  const who = a.name.trim() || "Someone";
  const need = a.need.length ? a.need.slice(0, 2).join(" + ") : "a project";
  return `Brief from ${who} — ${need}`;
}
