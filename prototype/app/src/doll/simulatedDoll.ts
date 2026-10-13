// A stand-in for the doll, running in the browser: the same rules and the
// same messages as the firmware. The demo page shows its Heart and Cross
// buttons and a copy of its LED, so one person can play both sides.
import type { DollLink, LinkStatus } from "./link";
import { nextState, type DollEvent } from "./rules";
import type { DollState } from "./protocol";

// About what a phone on the doll's WiFi sees.
const LATENCY_MS = 70;

type Listener = () => void;

export class SimulatedDoll {
  state: DollState = "idle";
  /** The doll is switched off or out of range. */
  unplugged = false;
  /** Another phone has the doll. */
  otherPhone = false;
  /** When the white acknowledgement flash started (performance.now()). */
  flashAt = -Infinity;

  private phone: ((raw: string) => void) | null = null;
  private phoneStatus: ((s: LinkStatus) => void) | null = null;
  private listeners = new Set<Listener>();

  /** Re-render the demo panel when anything changes. */
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private changed() { this.listeners.forEach((fn) => fn()); }

  get phoneConnected() {
    return this.phone !== null && !this.unplugged && !this.otherPhone;
  }

  /** The doll's handleEvent(): the one place where events are handled. */
  handle(event: DollEvent) {
    if (this.unplugged) return;
    const before = this.state;
    const after = nextState(before, event);
    if (event === "heart" || event === "cross") {
      this.flashAt = performance.now();
      this.toPhone(`event:${event}`);
    }
    if (after !== before) {
      this.state = after;
      this.toPhone(`status:${after}`);
    }
    this.changed();
  }

  pressHeart() { this.handle("heart"); }
  pressCross() { this.handle("cross"); }

  setUnplugged(on: boolean) {
    this.unplugged = on;
    this.reconnectPhone();
  }

  setOtherPhone(on: boolean) {
    this.otherPhone = on;
    this.reconnectPhone();
  }

  /** Re-announce the link and the current status, as on a real reconnect. */
  private reconnectPhone() {
    const report = this.phoneStatus;
    if (report) {
      if (this.unplugged) report("offline");
      else if (this.otherPhone) report("busy");
      else {
        report("connecting");
        setTimeout(() => {
          if (this.unplugged || this.otherPhone) return;
          report("online");
          this.toPhone(`status:${this.state}`);
        }, 450);
      }
    }
    this.changed();
  }

  private toPhone(message: string) {
    const deliver = this.phone;
    if (!deliver || !this.phoneConnected) return;
    setTimeout(() => deliver(message), LATENCY_MS);
  }

  /** The DollLink the app uses, wired to this doll. */
  link(): DollLink {
    return {
      start: ({ onStatus, onMessage }) => {
        this.phone = onMessage;
        this.phoneStatus = onStatus;
        this.reconnectPhone();
        this.changed();
        return () => {
          this.phone = null;
          this.phoneStatus = null;
          this.changed();
        };
      },
      send: (request) => {
        if (!this.phoneConnected) return;
        setTimeout(() => this.handle(request), LATENCY_MS);
      },
    };
  }
}
