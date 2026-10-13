// The real doll: a WebSocket at ws://<doll>/ws, as in docs/protocol.md.
import type { DollLink, LinkStatus } from "./link";

const RETRY_MS = 2000;

export function createLocalLink(host: string): DollLink {
  let socket: WebSocket | null = null;

  return {
    start({ onStatus, onMessage }) {
      let stopped = false;
      let retry: ReturnType<typeof setTimeout> | undefined;
      let status: LinkStatus = "connecting";
      const set = (s: LinkStatus) => { status = s; onStatus(s); };

      const connect = () => {
        if (stopped) return;
        if (status !== "busy") set(status === "offline" ? "offline" : "connecting");
        const ws = new WebSocket(`ws://${host}/ws`);
        socket = ws;
        ws.onopen = () => set("online");
        ws.onmessage = (e) => {
          const text = String(e.data).trim();
          // The doll turns away a second phone with "link:busy".
          if (text === "link:busy") { set("busy"); return; }
          onMessage(text);
        };
        ws.onclose = () => {
          if (socket === ws) socket = null;
          if (stopped) return;
          if (status !== "busy") set("offline");
          retry = setTimeout(connect, RETRY_MS);
        };
        ws.onerror = () => ws.close();
      };

      connect();
      return () => {
        stopped = true;
        clearTimeout(retry);
        socket?.close();
        socket = null;
      };
    },
    send(request) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(request);
    },
  };
}
