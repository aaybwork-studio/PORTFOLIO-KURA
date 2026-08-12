/**
 * FAQ accordion.
 *
 * Built on native <details>/<summary> rather than React state:
 * - taps open it on mobile with no handler of ours
 * - keyboard and screen readers get the right semantics for free
 * - it still works if the JS bundle fails
 *
 * The `name` attribute makes the group exclusive (opening one closes the rest)
 * in browsers that support it, and degrades to independent toggles elsewhere.
 */
import type { FaqItem } from "@/lib/types";
import styles from "./views.module.css";

type Props = { items: FaqItem[] };

export default function FaqList({ items }: Props) {
  if (!items.length) return null;

  return (
    <div className={styles.faqList}>
      {items.map((item, i) => (
        <details key={item.question + i} name="kura-faq" className={styles.faqItem}>
          <summary className={styles.faqQuestion} data-title="Open">
            <span>{item.question}</span>
            <span aria-hidden className={styles.faqMarker} />
          </summary>
          <div className={styles.faqAnswer}>
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
