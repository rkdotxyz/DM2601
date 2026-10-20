// The demo page: the phone app next to the simulated doll. On a wide
// screen the app sits in a phone frame with the doll beside it; on a
// phone, the app fills the screen and the doll docks at the bottom.
import { useEffect, useState } from "react";
import type { DollLink } from "../doll/link";
import type { SimulatedDoll } from "../doll/simulatedDoll";
import { PhoneApp } from "../app/PhoneApp";
import { DollPanel } from "./DollPanel";

const WIDE = "(min-width: 860px)";

export function DemoPage({ link, doll }: { link: DollLink; doll: SimulatedDoll }) {
  const [wide, setWide] = useState(() => matchMedia(WIDE).matches);
  useEffect(() => {
    const mq = matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (!wide) {
    return (
      <div className="demo-narrow">
        <div className="demo-narrow-app"><PhoneApp link={link} simulated /></div>
        <DollPanel doll={doll} compact />
      </div>
    );
  }

  return (
    <div className="demo-wide">
      <main className="demo-stage">
        <div className="device">
          <div className="device-screen"><PhoneApp link={link} simulated /></div>
        </div>
      </main>
      <aside className="demo-panel">
        <div className="panel-head">
          <p className="eyebrow">DM2601 · Group 11 · Interactive demo</p>
          <h1>Heart Doll</h1>
          <p className="lede">
            A doll whose heart glows when someone far away is there for you. One person has the
            doll; the other has this app. When you're both available, the heart fills and beats,
            on the phone and in the doll.
          </p>
        </div>
        <div className="panel-body">
          <DollPanel doll={doll} />
          <p className="links">
            <a href="../website/">Customise the doll →</a>
            <a href="https://github.com/rkdotxyz/DM2601/tree/main/prototype">How it's built →</a>
          </p>
        </div>
      </aside>
    </div>
  );
}
