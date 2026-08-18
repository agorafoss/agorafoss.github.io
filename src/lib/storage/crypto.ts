const ITERATIONS = 400_000;

export type SealedSecret = {
  v: 1;
  kdf: "pbkdf2-sha256";
  iter: number;
  salt: string;
  iv: string;
  ct: string;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function hasSecureCrypto(): boolean {
  return Boolean(globalThis.crypto?.subtle) && globalThis.isSecureContext !== false;
}

function subtle(): SubtleCrypto {
  if (!hasSecureCrypto() || !globalThis.crypto.subtle) {
    throw new Error("insecure-context");
  }
  return globalThis.crypto.subtle;
}

async function deriveKey(password: string, salt: Uint8Array, iterations = ITERATIONS): Promise<CryptoKey> {
  const material = await subtle().importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealSecret(secret: Uint8Array, password: string): Promise<SealedSecret> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await subtle().encrypt({ name: "AES-GCM", iv: iv.buffer as ArrayBuffer }, key, secret.buffer as ArrayBuffer);
  return {
    v: 1,
    kdf: "pbkdf2-sha256",
    iter: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ct)),
  };
}

export async function openSecret(sealed: SealedSecret, password: string): Promise<Uint8Array> {
  const salt = fromBase64(sealed.salt);
  const iv = fromBase64(sealed.iv);
  const ct = fromBase64(sealed.ct);
  const key = await deriveKey(password, salt, sealed.iter || ITERATIONS);
  try {
    const plain = await subtle().decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      ct.buffer as ArrayBuffer,
    );
    return new Uint8Array(plain);
  } catch {
    throw new Error("bad-password");
  }
}
