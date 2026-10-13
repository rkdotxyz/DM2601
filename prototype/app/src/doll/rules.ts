// The doll's rulebook, nextState() from firmware/heart_doll/state_machine.h,
// line for line. Only the simulated doll uses it: the real doll runs the
// C++ version, and the app just shows what it reports.
import type { DollState } from "./protocol";

export type DollEvent = "heart" | "cross" | "app:available" | "app:unavailable";

export function nextState(current: DollState, event: DollEvent): DollState {
  const phoneAvailable =
    current === "connected" || current === "declined" || current === "together";

  switch (event) {
    case "heart":
      return phoneAvailable ? "together" : "waiting";
    case "cross":
      return phoneAvailable ? "declined" : "idle";
    case "app:available":
      if (current === "waiting" || current === "together") return "together";
      return "connected";
    case "app:unavailable":
      if (current === "together" || current === "waiting") return "waiting";
      return "idle";
  }
}
