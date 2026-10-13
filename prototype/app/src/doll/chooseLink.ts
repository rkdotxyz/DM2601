// Which doll does this page talk to?
//   ?doll=192.168.4.1   the real doll at that address (handy from npm run dev)
//   ?doll=sim           the simulated doll
//   otherwise           the build decides: the demo and npm run dev use the
//                       simulated doll; the page the doll serves talks to
//                       the doll it came from.
import type { DollLink } from "./link";
import { createLocalLink } from "./localLink";
import { SimulatedDoll } from "./simulatedDoll";

export type LinkChoice =
  | { kind: "local"; link: DollLink; host: string }
  | { kind: "simulated"; link: DollLink; doll: SimulatedDoll };

export function chooseLink(): LinkChoice {
  const asked = new URLSearchParams(location.search).get("doll");
  const simulated =
    asked === "sim" || (!asked && import.meta.env.VITE_DOLL_LINK === "simulated");

  if (simulated) {
    const doll = new SimulatedDoll();
    return { kind: "simulated", link: doll.link(), doll };
  }
  const host = asked || location.host;
  return { kind: "local", link: createLocalLink(host), host };
}
