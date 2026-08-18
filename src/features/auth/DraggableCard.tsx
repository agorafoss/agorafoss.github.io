import { DotsSixVertical } from "@phosphor-icons/react";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import styles from "./AuthScreen.module.css";

type Props = {
  wide?: boolean;
  children: ReactNode;
};

export function DraggableCard({ wide, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ ox: number; oy: number } | null>(null);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    const card = ref.current;
    if (!card) return;
    const box = card.getBoundingClientRect();
    drag.current = { ox: event.clientX - box.left, oy: event.clientY - box.top };
    setPos({ x: box.left, y: box.top });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current || !ref.current) return;
    const width = ref.current.offsetWidth;
    const height = ref.current.offsetHeight;
    const x = Math.max(8, Math.min(window.innerWidth - width - 8, event.clientX - drag.current.ox));
    const y = Math.max(8, Math.min(window.innerHeight - height - 8, event.clientY - drag.current.oy));
    setPos({ x, y });
  }

  function onPointerUp() {
    drag.current = null;
  }

  return (
    <section
      ref={ref}
      className={styles.card}
      data-wide={wide ? "true" : "false"}
      data-free={pos ? "true" : "false"}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
    >
      <button
        type="button"
        className={styles.drag}
        aria-label="Mover"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <DotsSixVertical size={16} />
      </button>
      {children}
    </section>
  );
}
