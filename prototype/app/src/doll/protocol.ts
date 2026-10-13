// The doll <-> phone protocol, as in prototype/docs/protocol.md.
// Every message is a short line of plain text, "kind:value".

export const STATES = ["idle", "waiting", "connected", "declined", "together"] as const;
export type DollState = (typeof STATES)[number];

/** What the phone can ask for. The doll decides what happens. */
export type AppRequest = "app:available" | "app:unavailable";

/** Something the doll said, already parsed. */
export type DollMessage =
  | { kind: "status"; state: DollState }
  | { kind: "event"; event: "heart" | "cross" };

export function parseMessage(raw: string): DollMessage | null {
  const text = raw.trim();
  if (text.startsWith("status:")) {
    const state = text.slice(7) as DollState;
    return STATES.includes(state) ? { kind: "status", state } : null;
  }
  if (text === "event:heart") return { kind: "event", event: "heart" };
  if (text === "event:cross") return { kind: "event", event: "cross" };
  return null; // anything else is ignored, as on the doll
}

/** The two facts every state stands for, from the phone person's side. */
export function whoIsHere(state: DollState) {
  return {
    // Them (the doll person): available in waiting and together.
    them: state === "waiting" || state === "together",
    // You: available in connected, declined ("not now" from them; you're
    // still available) and together.
    you: state === "connected" || state === "declined" || state === "together",
  };
}
