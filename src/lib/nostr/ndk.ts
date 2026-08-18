import NDK, {
  NDKNip07Signer,
  NDKPrivateKeySigner,
  NDKRelayAuthPolicies,
  NDKRelayStatus,
  type NDKSigner,
} from "@nostr-dev-kit/ndk";
import type { AuthMethod, RelayInfo, RelayStatus } from "./types.ts";
import { CREATE_RELAY, GROUP_RELAY } from "./relays.ts";

let ndk: NDK | null = null;

export function getNdk(): NDK {
  if (!ndk) {
    throw new Error("ndk-not-started");
  }
  return ndk;
}

export function hasNdk(): boolean {
  return ndk !== null;
}

export function createSigner(method: AuthMethod, secretKey?: Uint8Array): NDKSigner {
  if (method === "nip07") {
    return new NDKNip07Signer(2500);
  }
  if (!secretKey) {
    throw new Error("missing-secret");
  }
  return new NDKPrivateKeySigner(secretKey);
}

export async function startNdk(relays: string[], signer: NDKSigner): Promise<NDK> {
  await stopNdk();
  const urls = [...new Set([...relays, GROUP_RELAY, CREATE_RELAY])];
  const instance = new NDK({
    explicitRelayUrls: urls,
    clientName: "agora",
  });
  if (signer instanceof NDKNip07Signer) {
    await signer.blockUntilReady();
  }
  instance.signer = signer;
  instance.relayAuthDefaultPolicy = NDKRelayAuthPolicies.signIn({ ndk: instance, signer });
  ndk = instance;
  await instance.connect(4000);
  return instance;
}

export async function withReadOnlyNdk<T>(
  relays: string[],
  fn: (instance: NDK) => Promise<T>,
): Promise<T> {
  const instance = new NDK({
    explicitRelayUrls: relays,
    clientName: "agora",
  });
  await instance.connect(4000);
  try {
    return await fn(instance);
  } finally {
    for (const relay of instance.pool.relays.values()) {
      relay.disconnect();
    }
  }
}

export async function stopNdk(): Promise<void> {
  if (!ndk) return;
  for (const relay of ndk.pool.relays.values()) {
    relay.disconnect();
  }
  ndk = null;
}

function mapStatus(status: NDKRelayStatus): RelayStatus {
  if (status >= NDKRelayStatus.CONNECTED) return "connected";
  if (status === NDKRelayStatus.CONNECTING || status === NDKRelayStatus.RECONNECTING) {
    return "connecting";
  }
  if (status === NDKRelayStatus.FLAPPING) return "error";
  return "disconnected";
}

export function snapshotRelays(): RelayInfo[] {
  if (!ndk) return [];
  return [...ndk.pool.relays.values()].map((relay) => ({
    url: relay.url,
    status: mapStatus(relay.status),
  }));
}

export function addRelayToPool(url: string): void {
  getNdk().addExplicitRelay(url, undefined, true);
}

export function removeRelayFromPool(url: string): void {
  getNdk().pool.removeRelay(url);
}

export function onRelayChange(listener: () => void): () => void {
  const instance = getNdk();
  const events = ["relay:connect", "relay:ready", "relay:disconnect", "relay:connecting"] as const;
  for (const event of events) {
    instance.pool.on(event, listener);
  }
  return () => {
    for (const event of events) {
      instance.pool.off(event, listener);
    }
  };
}
