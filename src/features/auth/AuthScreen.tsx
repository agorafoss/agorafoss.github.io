// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Key, Plugs, Radio, Translate, Waveform } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { VuMeter } from "../../app/shell/VuMeter.tsx";
import { changeLocale, type Locale } from "../../i18n/index.ts";
import { maskCadeadoInput } from "../../lib/nostr/cadeado.ts";
import { hasNip07 } from "../../lib/nostr/nip07.ts";
import { hasSecureCrypto } from "../../lib/storage/crypto.ts";
import { useAuthStore } from "./auth-store.ts";
import { DraggableCard } from "./DraggableCard.tsx";
import styles from "./AuthScreen.module.css";

type Mode = "choose" | "create" | "recover" | "pair" | "advanced";

export function AuthScreen() {
  const { t, i18n } = useTranslation();
  const status = useAuthStore((state) => state.status);
  const callsign = useAuthStore((state) => state.callsign);
  const error = useAuthStore((state) => state.error);
  const [mode, setMode] = useState<Mode>("choose");
  const nextLocale: Locale = i18n.language === "en" ? "pt-BR" : "en";

  return (
    <main className={styles.screen}>
      <p className={styles.meshHint}>{t("auth.meshHint")}</p>
      <DraggableCard>
        <div className={styles.callsign}>
          <span>{t("app.name")}</span>
          <VuMeter level={3} live />
        </div>
        <h1 className={styles.title}>
          {status === "locked" ? t("auth.unlockTitle") : t("auth.setupTitle")}
        </h1>
        <p className={styles.lead}>
          {status === "locked" ? t("auth.unlockLead") : t("auth.setupLead")}
        </p>
        {!hasSecureCrypto() ? <p className={styles.error}>{t("auth.errors.insecure-context")}</p> : null}

        {status === "locked" ? (
          <UnlockForm callsign={callsign} error={error} />
        ) : mode === "create" ? (
          <CreateForm error={error} onCancel={() => setMode("choose")} />
        ) : mode === "recover" ? (
          <RecoverForm error={error} onCancel={() => setMode("choose")} />
        ) : mode === "pair" ? (
          <PairForm error={error} onCancel={() => setMode("choose")} />
        ) : mode === "advanced" ? (
          <AdvancedForm error={error} onCancel={() => setMode("choose")} />
        ) : (
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => setMode("create")}>
              <Radio size={16} />
              {t("auth.create")}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setMode("recover")}>
              <Key size={16} />
              {t("auth.recover")}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setMode("pair")}>
              <Waveform size={16} />
              {t("auth.pair")}
            </button>
            <details className={styles.advanced}>
              <summary>{t("auth.advanced")}</summary>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={!hasNip07()}
                  onClick={() => void useAuthStore.getState().loginNip07()}
                >
                  <Plugs size={16} />
                  {hasNip07() ? t("auth.extension") : t("auth.noExtension")}
                </button>
                <button type="button" className={styles.ghost} onClick={() => setMode("advanced")}>
                  {t("auth.importNsec")}
                </button>
              </div>
            </details>
            {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
          </div>
        )}

        <button type="button" className={styles.ghost} onClick={() => void changeLocale(nextLocale)}>
          <Translate size={14} />
          {t("user.locale")}
        </button>
      </DraggableCard>
    </main>
  );
}

function UnlockForm({ callsign, error }: { callsign: string | null; error: string | null }) {
  const { t } = useTranslation();
  const unlock = useAuthStore((state) => state.unlock);
  const forget = useAuthStore((state) => state.forget);
  const [cadeado, setCadeado] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void unlock(cadeado);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {callsign ? <p className={styles.indicativo}>{callsign}</p> : null}
      <label>
        {t("auth.cadeado")}
        <input
          value={cadeado}
          onChange={(event) => setCadeado(maskCadeadoInput(event.target.value))}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          placeholder="K7M4-2NPQ"
        />
      </label>
      {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
      <button type="submit" className={styles.primary}>
        {t("auth.unlock")}
      </button>
      <button type="button" className={styles.ghost} onClick={() => void forget()}>
        {t("auth.forget")}
      </button>
    </form>
  );
}

function CreateForm({ error, onCancel }: { error: string | null; onCancel: () => void }) {
  const { t } = useTranslation();
  const createIndicativo = useAuthStore((state) => state.createIndicativo);
  const [name, setName] = useState("");
  const [picture, setPicture] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void createIndicativo(name, picture);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.hint}>{t("auth.createHint")}</p>
      <label>
        {t("auth.nickname")}
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} />
      </label>
      <label>
        {t("auth.pictureOptional")}
        <input
          value={picture}
          onChange={(event) => setPicture(event.target.value)}
          placeholder="https://"
        />
      </label>
      {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
      <button type="submit" className={styles.primary}>
        {t("auth.create")}
      </button>
      <button type="button" className={styles.ghost} onClick={onCancel}>
        {t("auth.back")}
      </button>
    </form>
  );
}

function RecoverForm({ error, onCancel }: { error: string | null; onCancel: () => void }) {
  const { t } = useTranslation();
  const recoverMnemonic = useAuthStore((state) => state.recoverMnemonic);
  const [words, setWords] = useState("");
  const [cadeado, setCadeado] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void recoverMnemonic(words, cadeado);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.hint}>{t("auth.recoverHint")}</p>
      <label>
        {t("auth.words")}
        <textarea value={words} onChange={(event) => setWords(event.target.value)} spellCheck={false} />
      </label>
      <label>
        {t("auth.sameLock")}
        <input
          value={cadeado}
          onChange={(event) => setCadeado(maskCadeadoInput(event.target.value))}
          autoComplete="off"
          spellCheck={false}
          placeholder="K7M4-2NPQ"
        />
      </label>
      {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
      <button type="submit" className={styles.primary}>
        {t("auth.recover")}
      </button>
      <button type="button" className={styles.ghost} onClick={onCancel}>
        {t("auth.back")}
      </button>
    </form>
  );
}

function PairForm({ error, onCancel }: { error: string | null; onCancel: () => void }) {
  const { t } = useTranslation();
  const claimPair = useAuthStore((state) => state.claimPair);
  const [code, setCode] = useState("");
  const [cadeado, setCadeado] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void claimPair(code, cadeado);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.hint}>{t("auth.pairHint")}</p>
      <label>
        {t("auth.pairCode")}
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.trim())}
          spellCheck={false}
          placeholder="código de 5 min"
        />
      </label>
      <label>
        {t("auth.sameLock")}
        <input
          value={cadeado}
          onChange={(event) => setCadeado(maskCadeadoInput(event.target.value))}
          spellCheck={false}
          placeholder="K7M4-2NPQ"
        />
      </label>
      {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
      <button type="submit" className={styles.primary}>
        {t("auth.pair")}
      </button>
      <button type="button" className={styles.ghost} onClick={onCancel}>
        {t("auth.back")}
      </button>
    </form>
  );
}

function AdvancedForm({ error, onCancel }: { error: string | null; onCancel: () => void }) {
  const { t } = useTranslation();
  const importAdvanced = useAuthStore((state) => state.importAdvanced);
  const [secret, setSecret] = useState("");
  const [cadeado, setCadeado] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void importAdvanced(secret, cadeado);
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.hint}>{t("auth.advancedHint")}</p>
      <label>
        {t("auth.secret")}
        <textarea value={secret} onChange={(event) => setSecret(event.target.value)} spellCheck={false} />
      </label>
      <label>
        {t("auth.sameLock")}
        <input
          value={cadeado}
          onChange={(event) => setCadeado(maskCadeadoInput(event.target.value))}
          spellCheck={false}
          placeholder="K7M4-2NPQ"
        />
      </label>
      {error ? <p className={styles.error}>{t(`auth.errors.${error}`)}</p> : null}
      <button type="submit" className={styles.primary}>
        {t("auth.importNsec")}
      </button>
      <button type="button" className={styles.ghost} onClick={onCancel}>
        {t("auth.back")}
      </button>
    </form>
  );
}
