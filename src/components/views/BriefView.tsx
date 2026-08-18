"use client";

import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import BriefIconCanvas from "@/components/three/BriefIconCanvas";
import { useSiteShell } from "@/components/shell/SiteShellContext";
import {
  BUDGET_BANDS,
  CURRENCIES,
  QUESTIONS,
  isValidEmail,
  type BriefAnswers,
  type Currency,
} from "@/lib/brief";
import styles from "./brief.module.css";

type Props = { email: string };

const EMPTY: BriefAnswers = {
  need: [],
  what: "",
  stage: "",
  timing: "",
  currency: "USD",
  budget: "",
  extra: "",
  name: "",
  email: "",
  link: "",
};

/*
 * Build a Brief.
 *
 * One question on screen at a time, seven steps, on the site's blue. The point
 * is someone who knows they need something and cannot yet say what: a page of
 * empty fields asks them to write a brief, and this asks them seven questions
 * that add up to one.
 *
 * Every step skips except the last. Skipping is not failure — "Not sure yet" is
 * a real answer and the reply is more useful for knowing it — but a brief with
 * no name and no address is not a brief, so the last step is the one gate.
 *
 * All of it is local state. Nothing is sent until the final submit, so there is
 * no half-finished record anywhere and someone who changes their mind simply
 * leaves.
 */
export default function BriefView({ email }: Props) {
  const { navigate } = useSiteShell();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<BriefAnswers>(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  /** honeypot — never shown, never focusable */
  const [company, setCompany] = useState("");

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const last = step === total - 1;

  const set = useCallback(<K extends keyof BriefAnswers>(key: K, value: BriefAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleNeed = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      need: prev.need.includes(option)
        ? prev.need.filter((v) => v !== option)
        : [...prev.need, option],
    }));
  };

  /*
   * A single-choice answer advances on its own.
   *
   * Tapping an option and then having to find Next is two actions for one
   * decision. Multi-select cannot do this — there is no way to know they have
   * finished picking — so that one keeps its button.
   */
  const choose = (id: string, option: string) => {
    set(id as keyof BriefAnswers, option as never);
    window.setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), 160);
  };

  const answered = useMemo(() => {
    if (!q) return false;
    switch (q.kind) {
      case "choice":
        return q.multi ? answers.need.length > 0 : Boolean(answers[q.id as "stage" | "timing"]);
      case "text":
        return (answers[q.id as "what" | "extra"] ?? "").trim().length > 0;
      case "budget":
        return answers.budget.length > 0;
      case "contact":
        return answers.name.trim().length > 0 && isValidEmail(answers.email);
    }
  }, [answers, q]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (!answers.name.trim()) {
      setError("A name, so I know who I am replying to.");
      return;
    }
    if (!isValidEmail(answers.email)) {
      setError("That email does not look right.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, company }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Could not send that.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Could not send that. Check your connection, or email me directly.");
    }
  };

  if (status === "sent") {
    return (
      <main className={styles.brief}>
        <div className={styles.inner}>
          <div className={styles.sent}>
            <BriefIconCanvas className={styles.sentIcon} />
            <h1 className={styles.sentTitle}>Got it.</h1>
            <p className={styles.sentBody}>
              That is in my inbox. You get a reply within two working days, including if I think
              someone else is the better fit for it.
            </p>
            <Link href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className={styles.sentLink}>
              Back to the work
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.brief}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <BriefIconCanvas className={styles.headIcon} />
          <h1 className={styles.title}>Brief</h1>
          <p className={styles.standfirst}>
            Seven questions, most of them a tap. It takes about two minutes, and it means the first
            conversation starts somewhere useful.
          </p>
        </header>

        {/* aria-live so the step change is announced, not just drawn. */}
        <div className={styles.progressRow}>
          <span className={styles.count}>
            {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className={styles.progressTrack} aria-hidden>
            <span
              className={styles.progressFill}
              style={{ transform: `scaleX(${(step + 1) / total})` }}
            />
          </span>
        </div>

        <form className={styles.step} onSubmit={submit} key={q.id}>
          <h2 className={styles.question}>{q.title}</h2>
          {q.hint ? <p className={styles.hint}>{q.hint}</p> : null}

          {q.kind === "choice" ? (
            <div className={styles.options}>
              {q.options.map((option) => {
                const on = q.multi
                  ? answers.need.includes(option)
                  : answers[q.id as "stage" | "timing"] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={styles.option}
                    data-on={on ? "true" : "false"}
                    aria-pressed={on}
                    onClick={() => (q.multi ? toggleNeed(option) : choose(q.id, option))}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : null}

          {q.kind === "text" ? (
            q.id === "extra" ? (
              <textarea
                className={styles.textarea}
                rows={4}
                value={answers.extra}
                onChange={(e) => set("extra", e.target.value)}
                placeholder={q.placeholder}
                aria-label={q.title}
              />
            ) : (
              <input
                className={styles.input}
                type="text"
                value={answers.what}
                onChange={(e) => set("what", e.target.value)}
                placeholder={q.placeholder}
                aria-label={q.title}
              />
            )
          ) : null}

          {q.kind === "budget" ? (
            <>
              <div className={styles.currency} role="group" aria-label="Currency">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.currencyBtn}
                    data-on={answers.currency === c ? "true" : "false"}
                    aria-pressed={answers.currency === c}
                    onClick={() => setAnswers((p) => ({ ...p, currency: c, budget: "" }))}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className={styles.options}>
                {BUDGET_BANDS[answers.currency].map((band) => (
                  <button
                    key={band}
                    type="button"
                    className={styles.option}
                    data-on={answers.budget === band ? "true" : "false"}
                    aria-pressed={answers.budget === band}
                    onClick={() => choose("budget", band)}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {q.kind === "contact" ? (
            <div className={styles.contactGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Name</span>
                <input
                  className={styles.input}
                  type="text"
                  required
                  value={answers.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <input
                  className={styles.input}
                  type="email"
                  required
                  value={answers.email}
                  onChange={(e) => set("email", e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </label>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.fieldLabel}>A link, if there is one (optional)</span>
                <input
                  className={styles.input}
                  type="url"
                  value={answers.link}
                  onChange={(e) => set("link", e.target.value)}
                  placeholder="https://"
                />
              </label>

              {/*
                Honeypot. Hidden from sight, from the tab order and from screen
                readers — only something filling every input finds it.
              */}
              <input
                className={styles.pot}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
              {error}{" "}
              <a href={`mailto:${email}`} className={styles.errorLink}>
                {email}
              </a>
            </p>
          ) : null}

          <div className={styles.actions}>
            {step === 0 ? (
              <Link
                href="/#contact"
                onClick={(e) => { e.preventDefault(); navigate("/", "contact"); }}
                className={styles.back}
              >
                ← Contact
              </Link>
            ) : (
              <button type="button" className={styles.back} onClick={() => setStep((s) => s - 1)}>
                ← Back
              </button>
            )}

            <div className={styles.forward}>
              {!last && q.skippable ? (
                <button
                  type="button"
                  className={styles.skip}
                  onClick={() => setStep((s) => Math.min(s + 1, total - 1))}
                >
                  Skip
                </button>
              ) : null}

              {last ? (
                <button type="submit" className={styles.next} disabled={!answered || status === "sending"}>
                  {status === "sending" ? "Sending…" : "Send the brief"}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.next}
                  disabled={!answered}
                  onClick={() => setStep((s) => Math.min(s + 1, total - 1))}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
