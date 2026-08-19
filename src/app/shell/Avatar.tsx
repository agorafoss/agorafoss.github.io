// Copyright (C) 2026 Ágora
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from "react";
import styles from "./Avatar.module.css";

type Props = {
  name: string;
  hue: number;
  size?: number;
  picture?: string;
};

export function Avatar({ name, hue, size = 32, picture }: Props) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [picture]);

  const faceStyle = { ["--hue" as string]: hue, ["--size" as string]: `${size}px` };

  if (picture && !broken) {
    return (
      <img
        className={styles.face}
        style={faceStyle}
        src={picture}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className={styles.face} style={faceStyle} aria-hidden>
      {initials}
    </span>
  );
}
