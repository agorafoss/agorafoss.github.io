// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useTranslation } from "react-i18next";
import { changeLocale, type Locale } from "../../i18n/index.ts";
import { guideFor, type GuideBlock } from "./guide.ts";
import styles from "./DocsPage.module.css";

type Props = {
  onBack: () => void;
  onEnter: () => void;
};

function Block({ block }: { block: GuideBlock }) {
  if (block.type === "p") return <p>{block.text}</p>;
  if (block.type === "note") return <p className={styles.note}>{block.text}</p>;
  if (block.type === "ul") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocsPage({ onBack, onEnter }: Props) {
  const { t, i18n } = useTranslation();
  const guide = guideFor(i18n.language);
  const nextLocale: Locale = i18n.language === "en" ? "pt-BR" : "en";

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <button type="button" className={styles.brand} onClick={onBack}>
          {t("app.name")}
        </button>
        <div className={styles.navActions}>
          <button type="button" className={styles.ghost} onClick={() => void changeLocale(nextLocale)}>
            {nextLocale === "en" ? "EN" : "PT"}
          </button>
          <a className={styles.ghost} href="https://github.com/agorafoss/agorafoss.github.io/tree/0.2/docs">
            GitHub
          </a>
          <button type="button" className={styles.enter} onClick={onEnter}>
            {t("landing.enter")}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.toc} aria-label={t("landing.docs")}>
          <p className={styles.tocKicker}>{guide.kicker}</p>
          {guide.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>

        <article className={styles.body}>
          <p className={styles.kicker}>{guide.kicker}</p>
          <h1>{guide.title}</h1>
          <p className={styles.lead}>{guide.lead}</p>
          <p className={styles.repo}>{guide.github}</p>

          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) => (
                <Block key={`${section.id}-${index}`} block={block} />
              ))}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
