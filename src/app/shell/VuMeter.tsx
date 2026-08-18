import styles from "./VuMeter.module.css";

type Props = {
  level: number;
  live?: boolean;
  size?: number;
};

export function VuMeter({ level, live = false, size = 12 }: Props) {
  const clamped = Math.max(0, Math.min(4, level));
  return (
    <span className={styles.meter} style={{ ["--h" as string]: `${size}px` }} aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className={styles.bar}
          data-on={index < clamped}
          data-live={live}
          style={{
            height: `${5 + index * 2}px`,
            ["--dur-bar" as string]: `${700 + index * 160}ms`,
          }}
        />
      ))}
    </span>
  );
}
