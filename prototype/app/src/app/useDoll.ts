// The app's whole view of the doll: the link status, who is here, and the
// latest one-off event. The doll is the source of truth: toggle() only
// sends a request, and nothing changes until the doll reports back.
import { useCallback, useEffect, useRef, useState } from "react";
import type { DollLink, LinkStatus } from "../doll/link";
import { parseMessage, whoIsHere, type DollState } from "../doll/protocol";

export type DollEventPing = { event: "heart" | "cross"; at: number };

// If the doll hasn't answered a tap within this long, stop showing it as
// pending (the request was lost; the picture still shows the truth).
const PENDING_TIMEOUT_MS = 3000;

export function useDoll(link: DollLink) {
  const [link_, setLink] = useState<LinkStatus>("connecting");
  const [state, setState] = useState<DollState | null>(null);
  const [ping, setPing] = useState<DollEventPing | null>(null);
  const [pending, setPending] = useState(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return link.start({
      onStatus: setLink,
      onMessage: (raw) => {
        const msg = parseMessage(raw);
        if (!msg) return;
        if (msg.kind === "status") {
          setState(msg.state);
          setPending(false);
          clearTimeout(pendingTimer.current);
        } else {
          setPing({ event: msg.event, at: performance.now() });
          if (msg.event === "heart") navigator.vibrate?.([60, 50, 60]); // Android only
        }
      },
    });
  }, [link]);

  const here = whoIsHere(state ?? "idle");
  const online = link_ === "online" && state !== null;

  const toggle = useCallback(() => {
    if (!online) return;
    link.send(here.you ? "app:unavailable" : "app:available");
    navigator.vibrate?.(12);
    setPending(true);
    clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => setPending(false), PENDING_TIMEOUT_MS);
  }, [online, here.you, link]);

  return { link: link_, online, state, them: here.them, you: here.you, ping, pending, toggle };
}
