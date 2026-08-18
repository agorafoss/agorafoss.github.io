// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CHAT_EMOJI, openMojiUrl } from "../../lib/nostr/openmoji.ts";
import styles from "./EmojiPicker.module.css";

type Props = {
  onPick: (emoji: string) => void;
};

export function EmojiPicker({ onPick }: Props) {
  return (
    <div className={styles.grid} role="listbox">
      {CHAT_EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={styles.cell}
          title={emoji}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onPick(emoji);
          }}
        >
          <img src={openMojiUrl(emoji)} alt={emoji} width={22} height={22} />
        </button>
      ))}
    </div>
  );
}
