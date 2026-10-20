// The simulated doll's controls, for the demo: its Heart and Cross
// buttons, a copy of its LED, and switches for the situations you can't
// otherwise show without the hardware.
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { SimulatedDoll } from "../doll/simulatedDoll";
import { ledLevel } from "./led";

const STATE_TEXT: Record<string, string> = {
  idle: "Nobody is available",
  waiting: "Only the doll person is available",
  connected: "Only the phone person is available",
  declined: "The doll person said “not now”",
  together: "Both are available",
};

const STATE_NAME: Record<string, string> = {
  idle: "Idle",
  waiting: "Waiting",
  connected: "Connected",
  declined: "Not now",
  together: "Together",
};

const LED_TEXT: Record<string, string> = {
  idle: "Off",
  waiting: "Slow red breathing",
  connected: "Heartbeat at 60%",
  declined: "Off",
  together: "Heartbeat at 100%",
};

export function DollPanel({ doll, compact = false }: { doll: SimulatedDoll; compact?: boolean }) {
  // Re-render whenever the simulated doll changes.
  const snap = useSyncExternalStore(
    (fn) => doll.subscribe(fn),
    () => `${doll.state}|${doll.unplugged}|${doll.otherPhone}|${doll.phoneConnected}`,
  );
  void snap;

  const off = doll.unplugged;
  const ledText = off ? "Off" : LED_TEXT[doll.state] + (!doll.phoneConnected ? ", blue blink (no phone)" : "");

  return (
    <section className={`doll${compact ? " compact" : ""}`} aria-label="Simulated doll">
      {!compact && (
        <>
          <h2>The doll</h2>
          <p className="hint">
            You're both people here. Press <b>Heart</b> or <b>Cross</b> as the person with the doll,
            and tap your photo in the app as the person with the phone.
          </p>
        </>
      )}

      {/* the doll's state and its LED, like the website's state card */}
      <div className="state">
        <Led doll={doll} />
        <div className="state-text">
          <span className="state-name">{off ? "Switched off" : STATE_NAME[doll.state]}</span>
          <span className="state-note">{compact ? ledText : off ? "The doll has no power." : STATE_TEXT[doll.state]}</span>
          {!compact && !off && <span className="state-note">LED: {ledText}</span>}
        </div>
      </div>

      <div className="doll-buttons">
        <button className="hw heart" onClick={() => doll.pressHeart()} disabled={off}>
          <svg viewBox="0 0 100 92" aria-hidden><path d="M50 88 C20 66 4 50 4 30 C4 15 15 4 29 4 C38 4 46 9 50 17 C54 9 62 4 71 4 C85 4 96 15 96 30 C96 50 80 66 50 88 Z" /></svg>
          <span>Heart</span>
        </button>
        <button className="hw cross" onClick={() => doll.pressCross()} disabled={off}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6 L18 18 M18 6 L6 18" /></svg>
          <span>Cross</span>
        </button>
      </div>

      <div className="doll-switches">
        <label className="switch">
          <input type="checkbox" checked={doll.unplugged} onChange={(e) => doll.setUnplugged(e.target.checked)} />
          <span className="switch-track" />
          <span>Doll switched off</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={doll.otherPhone} onChange={(e) => doll.setOtherPhone(e.target.checked)} />
          <span className="switch-track" />
          <span>Another phone has it</span>
        </label>
      </div>
    </section>
  );
}

/** A copy of the doll's RGB LED, drawn with the firmware's own pattern maths. */
function Led({ doll }: { doll: SimulatedDoll }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const [r, g, b] = ledLevel(doll, performance.now());
      const el = ref.current;
      if (el) {
        const lit = Math.max(r, g, b);
        // On screen, show the brightness the eye sees (the doll's gamma
        // correction makes its fades look even, so this is just the level).
        const R = Math.round(255 * Math.max(r, g * 0.9, b * 0.25));
        const G = Math.round(255 * Math.max(g, b * 0.45, r * 0.16));
        const B = Math.round(255 * Math.max(b, g, r * 0.24));
        el.style.setProperty("--led", `rgb(${R} ${G} ${B} / ${0.12 + lit * 0.88})`);
        el.style.setProperty("--led-glow", `${(lit * 26).toFixed(1)}px`);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [doll]);
  return <div ref={ref} className="led" aria-hidden />;
}
