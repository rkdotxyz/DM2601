// A DollLink is how the app talks to a doll. The screens only ever use
// this interface, so the doll behind it can be swapped without touching
// the UI: the real doll over WiFi today, a simulated one for the demo,
// and a cloud relay (MQTT) later.
import type { AppRequest } from "./protocol";

export type LinkStatus =
  | "connecting" // trying to reach the doll
  | "online" //     connected; messages flow
  | "offline" //    the doll can't be reached; retrying by itself
  | "busy"; //      another phone is using the doll

export interface DollLink {
  /** Start talking. Returns a function that stops. */
  start(handlers: {
    onStatus: (status: LinkStatus) => void;
    onMessage: (raw: string) => void;
  }): () => void;
  /** Send a request. Ignored while not online. */
  send(request: AppRequest): void;
}
