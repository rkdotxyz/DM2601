// The phone app: a quiet header, one line about what's happening, the 3D
// heart, and a card over it when the doll can't be reached or is busy.
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { DollLink } from "../doll/link";
import { Stage } from "../scene/Stage";
import { useDoll } from "./useDoll";
import * as sound from "../fx/sound";
import { tapFeel } from "../fx/haptics";
import { enableMotion, startTilt } from "../fx/tilt";

type Props = { link: DollLink; simulated: boolean };

const ease = [0.22, 1, 0.36, 1] as const;

export function PhoneApp({ link, simulated }: Props) {
  const doll = useDoll(link);
  const { them, you, online, pending } = doll;
  const calm = useReducedMotion() ?? false;
  const [muted, setMuted] = useState(sound.isMuted());

  // Sound and the iPhone's motion sensor both need a first tap.
  useEffect(() => {
    startTilt();
    const first = () => { sound.unlock(); enableMotion(); };
    addEventListener("pointerdown", first);
    return () => removeEventListener("pointerdown", first);
  }, []);

  const toggle = useCallback(() => {
    if (!online) return;
    sound.unlock();
    sound.tick();
    tapFeel();
    doll.toggle();
  }, [online, doll]);

  const line = !online ? null
    : them && you ? { title: "Together", sub: "Both hearts are here." }
    : them ? { title: "They're here for you", sub: "Tap yourself to join them." }
    : you ? { title: "You're here", sub: "Your heart is on its way to them." }
    : { title: "Quiet for now", sub: "Tap yourself when you're free." };

  return (
    <div className={`phone${them && you ? " full" : ""}`}>
      <div className="sky" aria-hidden />

      <header className="bar">
        <div className="brand">
          <svg viewBox="0 0 100 92" aria-hidden><path d="M50 88 C20 66 4 50 4 30 C4 15 15 4 29 4 C38 4 46 9 50 17 C54 9 62 4 71 4 C85 4 96 15 96 30 C96 50 80 66 50 88 Z" /></svg>
          Heart Doll
        </div>
        <div className="bar-right">
          <button className="icon-btn" aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}
            title={muted ? "Sound on" : "Sound off"}
            onClick={() => { sound.unlock(); sound.setMuted(!muted); setMuted(!muted); }}>
            <Icon d={muted ? ICONS.soundOff : ICONS.soundOn} />
          </button>
          <LinkPill status={doll.link} simulated={simulated} />
        </div>
      </header>

      <div className="headline" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={line?.title ?? "finding"}
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease }}>
            <h1 className={line ? "" : "muted"}>{line?.title ?? "Finding the doll…"}</h1>
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p key={pending ? "pending" : line?.sub ?? "none"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}>
            {pending ? "Telling the doll…" : line?.sub ?? " "}
          </motion.p>
        </AnimatePresence>
      </div>

      <main className="stage">
        <Stage them={them} you={you} online={online} state={doll.state ?? "idle"} pending={pending} ping={doll.ping} calm={calm} onToggle={toggle} />
      </main>

      {/* The same toggle, for keyboards and screen readers. */}
      <button className="sr-only" onClick={toggle} disabled={!online} aria-pressed={you}>
        {you ? "Step away" : "I'm available"}
      </button>

      <AnimatePresence>
        {(doll.link === "offline" || doll.link === "busy") && (
          <motion.div className="veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card" role="alert"
              initial={{ y: 28, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 12, scale: 0.98, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}>
              {doll.link === "busy" ? (
                <>
                  <div className="card-icon"><svg viewBox="0 0 100 92"><path d="M50 88 C20 66 4 50 4 30 C4 15 15 4 29 4 C38 4 46 9 50 17 C54 9 62 4 71 4 C85 4 96 15 96 30 C96 50 80 66 50 88 Z" /></svg></div>
                  <h2>Someone else is with the doll</h2>
                  <p>The doll takes one phone at a time. When they leave, you'll join by yourself.</p>
                </>
              ) : (
                <>
                  <div className="card-icon"><span className="spinner" /></div>
                  <h2>Can't reach the doll</h2>
                  <p>{simulated ? "The simulated doll is switched off. Switch it back on in the panel."
                    : "Check that your phone is on the doll's WiFi. Trying again…"}</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LinkPill({ status, simulated }: { status: string; simulated: boolean }) {
  const label = status === "online" ? (simulated ? "Simulated" : "Connected")
    : status === "busy" ? "In use"
    : status === "offline" ? "Offline" : "Connecting";
  return (
    <div className={`pill ${status}`} aria-live="polite" title={`Doll: ${label}`}>
      <i />
      {label}
    </div>
  );
}

// Line icons in the website's style (website/src/App.tsx).
function Icon({ d }: { d: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
}

const ICONS = {
  soundOn: "M4 9.5h3.2L12 5.5v13l-4.8-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  soundOff: "M4 9.5h3.2L12 5.5v13l-4.8-4H4zM16 9.5l5 5M21 9.5l-5 5",
};
