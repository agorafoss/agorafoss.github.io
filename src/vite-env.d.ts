/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

type Nip07Event = {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey?: string;
  id?: string;
  sig?: string;
};

interface Window {
  nostr?: {
    getPublicKey: () => Promise<string>;
    signEvent: (event: Nip07Event) => Promise<Nip07Event>;
  };
}
