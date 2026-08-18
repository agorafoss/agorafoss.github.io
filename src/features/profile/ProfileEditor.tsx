import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../auth/auth-store.ts";
import { useProfileStore } from "./profile-store.ts";
import styles from "./ProfileEditor.module.css";

export function ProfileEditor() {
  const { t } = useTranslation();
  const npub = useAuthStore((state) => state.npub);
  const own = useProfileStore((state) => state.own);
  const peeked = useProfileStore((state) => state.peeked);
  const busy = useProfileStore((state) => state.busy);
  const error = useProfileStore((state) => state.error);
  const saveOwn = useProfileStore((state) => state.saveOwn);
  const lookup = useProfileStore((state) => state.lookup);
  const [draft, setDraft] = useState(own);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDraft(own);
  }, [own]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void saveOwn(draft);
  }

  function search(event: FormEvent) {
    event.preventDefault();
    void lookup(query);
  }

  return (
    <div>
      <form className={styles.form} onSubmit={submit}>
        {npub ? <p className={styles.npub}>{npub}</p> : null}
        <label>
          {t("profile.name")}
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          {t("profile.displayName")}
          <input
            value={draft.displayName}
            onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
          />
        </label>
        <label>
          {t("profile.about")}
          <textarea
            value={draft.about}
            onChange={(event) => setDraft({ ...draft, about: event.target.value })}
          />
        </label>
        <label>
          {t("profile.picture")}
          <input
            value={draft.picture}
            onChange={(event) => setDraft({ ...draft, picture: event.target.value })}
            placeholder="https://"
          />
        </label>
        {error && error.startsWith("profile-publish") ? (
          <p className={styles.error}>{t(`profile.errors.${error}`)}</p>
        ) : null}
        <button type="submit" className={styles.save} disabled={busy}>
          {busy ? t("profile.saving") : t("profile.save")}
        </button>
        <p className={styles.hint}>{t("profile.hint")}</p>
      </form>

      <form className={styles.lookup} onSubmit={search}>
        <label>
          {t("profile.lookup")}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="npub1…"
            spellCheck={false}
          />
        </label>
        <button type="submit" className={styles.save} disabled={busy || !query.trim()}>
          {t("profile.look")}
        </button>
        {error === "profile-lookup-failed" ? (
          <p className={styles.error}>{t("profile.errors.profile-lookup-failed")}</p>
        ) : null}
        {peeked ? (
          <div className={styles.peek}>
            <div className={styles.peekName}>{peeked.profile.displayName || peeked.profile.name || peeked.npub}</div>
            <div className={styles.npub}>{peeked.npub}</div>
            {peeked.profile.about ? <p>{peeked.profile.about}</p> : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
