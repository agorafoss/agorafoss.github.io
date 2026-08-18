import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { loadNetworkMap } from "../../lib/nostr/network.ts";
import styles from "./Atmosphere.module.css";

type Props = {
  intensity?: "stage" | "room";
};

type Tag = { id: "you" | "nostr" | "tor"; text: string; x: number; y: number };
type Mesh = { nostr: string[]; onion: string[] };

const AMBER = 0xe6a23c;
const PAPER = 0xede4d4;

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^wss?:\/\//, "");
  }
}

function makeCloud(color: number, size: number, opacity: number): THREE.Points {
  return new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
}

function fillSpiral(points: THREE.Points, urls: string[], arm: number, arms: number, count: number): THREE.Vector3 {
  const positions = new Float32Array(count * 3);
  const mid = new THREE.Vector3();
  const turns = 2.35;
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const seed = hash((urls[i % Math.max(urls.length, 1)] ?? "star") + String(i));
    const wander = ((seed % 1000) / 1000 - 0.5) * (0.12 + t * 0.7);
    const theta = t * turns * Math.PI * 2 + (arm * Math.PI * 2) / arms + (seed % 17) * 0.01;
    const radius = 0.42 + t * 4.6 + wander;
    const height = ((seed % 800) / 800 - 0.5) * (0.08 + t * 0.22);
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(theta) * radius;
    if (i === Math.floor(count * 0.55)) {
      mid.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    }
  }
  points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  points.geometry.computeBoundingSphere();
  return mid;
}

function fillBulge(points: THREE.Points, count: number): void {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = Math.pow(Math.random(), 0.55) * 0.55;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.45;
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
}

export function Atmosphere({ intensity = "stage" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState<null | "nostr" | "tor">(null);
  const [mesh, setMesh] = useState<Mesh>({ nostr: [], onion: [] });
  const interactive = intensity === "stage";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x100e0c, 0.038);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 90);
    const focus = new THREE.Vector3(0, 0.15, 0);
    const placeCamera = () => {
      const width = Math.max(canvas.clientWidth, 1);
      const card = interactive ? Math.min(420, width * 0.34) : 0;
      const mid = (width - card) / 2 / width;
      camera.position.set(0, 2.15, interactive ? 8.2 : 9.2);
      focus.set((0.5 - mid) * 6.4, 0.25, 0);
      camera.lookAt(focus);
    };

    const root = new THREE.Group();
    scene.add(root);

    const stars = makeCloud(PAPER, 0.016, 0.32);
    const starPos = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i += 1) {
      starPos[i * 3] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    stars.geometry.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    scene.add(stars);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 28, 28),
      new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.22 }),
    );
    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 24, 24),
      new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.06 }),
    );
    const bulge = makeCloud(AMBER, 0.028, 0.9);
    fillBulge(bulge, 520);
    root.add(core, coreGlow, bulge);

    const nostrArm = makeCloud(AMBER, 0.038, intensity === "stage" ? 0.88 : 0.4);
    const torArm = makeCloud(PAPER, 0.032, intensity === "stage" ? 0.62 : 0.26);
    root.add(nostrArm, torArm);

    const anchors = {
      you: new THREE.Vector3(0, 0.12, 0),
      nostr: new THREE.Vector3(2.4, 0.15, 1.6),
      tor: new THREE.Vector3(-2.2, -0.1, -1.8),
    };

    const applyMap = (nostr: string[], onion: string[]) => {
      setMesh({ nostr, onion });
      anchors.nostr.copy(fillSpiral(nostrArm, nostr.length ? nostr : ["wss://relay.damus.io"], 0, 2, Math.max(1800, nostr.length * 6)));
      anchors.tor.copy(
        fillSpiral(
          torArm,
          onion.length ? onion : Array.from({ length: 220 }, (_, i) => `onion:${i}`),
          1,
          2,
          Math.max(2400, onion.length * 8),
        ),
      );
    };

    applyMap([], []);
    void loadNetworkMap().then((map) => applyMap(map.nostr, map.onion));

    const drag = { on: false, x: 0, y: 0, rotY: 0.35, rotX: 0.62 };
    const onDown = (event: PointerEvent) => {
      if (!interactive) return;
      drag.on = true;
      drag.x = event.clientX;
      drag.y = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!drag.on) return;
      drag.rotY += (event.clientX - drag.x) * 0.0045;
      drag.rotX += (event.clientY - drag.y) * 0.003;
      drag.rotX = Math.max(0.2, Math.min(1.15, drag.rotX));
      drag.x = event.clientX;
      drag.y = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      drag.on = false;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (!interactive) return;
      camera.position.z = Math.max(5, Math.min(16, camera.position.z + event.deltaY * 0.012));
    };
    if (interactive) {
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointerleave", onUp);
      canvas.addEventListener("wheel", onWheel, { passive: true });
    }

    let visible = document.visibilityState === "visible";
    const onVis = () => {
      visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      placeCamera();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const started = performance.now();
    let frame = 0;
    let tickCount = 0;
    const project = (point: THREE.Vector3, id: Tag["id"], text: string): Tag | null => {
      const projected = point.clone().applyMatrix4(root.matrixWorld).project(camera);
      if (projected.z > 1) return null;
      return {
        id,
        text,
        x: (projected.x * 0.5 + 0.5) * 100,
        y: (-projected.y * 0.5 + 0.5) * 100,
      };
    };

    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      if (!visible) return;
      const time = (performance.now() - started) / 1000;
      root.rotation.y = drag.rotY + time * 0.035;
      root.rotation.x = drag.rotX;
      camera.lookAt(focus);
      core.rotation.y += 0.004;
      bulge.rotation.y += 0.0015;
      if (tickCount++ % 4 === 0) {
        setTags(
          [
            project(anchors.you, "you", "ÁGORA"),
            project(anchors.nostr, "nostr", "NOSTR"),
            project(anchors.tor, "tor", "TOR"),
          ].filter((item): item is Tag => Boolean(item)),
        );
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      canvas.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [intensity, interactive]);

  const list = open === "nostr" ? mesh.nostr : open === "tor" ? mesh.onion : [];
  const openTag = tags.find((tag) => tag.id === open);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        data-intensity={intensity}
        data-live={interactive ? "true" : "false"}
        aria-hidden
      />
      {interactive
        ? tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={styles.tag}
              data-id={tag.id}
              style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              onClick={() => setOpen(tag.id === "you" ? null : open === tag.id ? null : tag.id)}
            >
              {tag.text}
            </button>
          ))
        : null}
      {interactive && open && openTag ? (
        <aside className={styles.sheet} style={{ left: `${openTag.x}%`, top: `${Math.min(openTag.y + 6, 72)}%` }}>
          <header>
            <span>{open === "nostr" ? "Nostr" : "Tor"}</span>
            <span>{list.length}</span>
          </header>
          <ul>
            {(list.length ? list : ["— malha ainda sem índice —"]).map((url) => (
              <li key={url}>{hostOf(url)}</li>
            ))}
          </ul>
        </aside>
      ) : null}
    </>
  );
}
