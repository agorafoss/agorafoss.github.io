import styles from "./Avatar.module.css";

type Props = {
  name: string;
  hue: number;
  size?: number;
};

export function Avatar({ name, hue, size = 32 }: Props) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={styles.face}
      style={{ ["--hue" as string]: hue, ["--size" as string]: `${size}px` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
