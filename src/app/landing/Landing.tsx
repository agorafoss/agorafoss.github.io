// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { GithubLogo } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { changeLocale, type Locale } from "../../i18n/index.ts";
import { FlowMap } from "./FlowMap.tsx";
import styles from "./Landing.module.css";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  onEnter: () => void;
};

export function Landing({ onEnter }: Props) {
  const { t, i18n } = useTranslation();
  const scroller = useRef<HTMLElement>(null);
  const nextLocale: Locale = i18n.language === "en" ? "pt-BR" : "en";

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-hero] > *", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.07,
        ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>("[data-block]").forEach((block) => {
        gsap.from(block, {
          y: 24,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            scroller: root,
            trigger: block,
            start: "top 88%",
            once: true,
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={scroller} className={styles.page} id="landing">
      <header className={styles.nav}>
        <span className={styles.brand}>{t("app.name")}</span>
        <div className={styles.navActions}>
          <button type="button" className={styles.ghost} onClick={() => void changeLocale(nextLocale)}>
            {nextLocale === "en" ? "EN" : "PT"}
          </button>
          <a className={styles.ghost} href="https://github.com/agorafoss/agora-desktop">
            {t("landing.desktop")}
          </a>
          <button type="button" className={styles.enter} onClick={onEnter}>
            {t("landing.enter")}
          </button>
        </div>
      </header>

      <p className={styles.banner} role="status">
        <strong>{t("landing.noticeTitle")}</strong> {t("landing.notice")}
      </p>

      <section className={styles.hero}>
        <div className={styles.heroPanel} data-hero>
          <h1 className={styles.title}>{t("landing.heroTitle")}</h1>
          <p className={styles.lead}>{t("landing.heroLead")}</p>
          <div className={styles.cta}>
            <button type="button" className={styles.enter} onClick={onEnter}>
              {t("landing.enter")}
            </button>
            <a className={styles.ghost} href="https://github.com/agorafoss/agora-desktop">
              {t("landing.desktop")}
            </a>
          </div>
        </div>
      </section>

      <section className={styles.origin} data-block>
        <p className={styles.greek} lang="grc">
          {t("landing.origin.greek")}
        </p>
        <p className={styles.greekHint}>{t("landing.origin.lang")}</p>
        <h2 className={styles.originTitle}>{t("landing.origin.title")}</h2>
        <div className={styles.originProse}>
          <p>{t("landing.origin.word")}</p>
          <p>{t("landing.origin.place")}</p>
          <p>{t("landing.origin.people")}</p>
          <p>{t("landing.origin.why")}</p>
        </div>
      </section>

      <FlowMap />

      <section className={styles.facts} data-block>
        {(
          [
            ["identity", "identityBody"],
            ["web", "webBody"],
            ["wip", "wipBody"],
          ] as const
        ).map(([title, body]) => (
          <article key={title} className={styles.fact}>
            <h2>{t(`landing.stack.${title}`)}</h2>
            <p>{t(`landing.stack.${body}`)}</p>
          </article>
        ))}
      </section>

      <footer className={styles.foot} data-block>
        <h2>{t("landing.gitTitle")}</h2>
        <div className={styles.git}>
          <a className={styles.gitCard} href="https://github.com/agorafoss" target="_blank" rel="noreferrer">
            <GithubLogo size={22} />
            <span>
              <strong>{t("landing.gitUs")}</strong>
              {t("landing.gitUsHint")}
            </span>
          </a>
          <a className={styles.gitCard} href="https://github.com/nostr-protocol" target="_blank" rel="noreferrer">
            <GithubLogo size={22} />
            <span>
              <strong>{t("landing.gitNostr")}</strong>
              {t("landing.gitNostrHint")}
            </span>
          </a>
        </div>
        <p className={styles.license}>{t("landing.license")}</p>
      </footer>
    </main>
  );
}
