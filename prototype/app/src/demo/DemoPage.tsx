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
      <div className="demo-intro">
        <div className="eyebrow">DM2601 · Group 11 · Interactive demo</div>
        <h1>Heart Doll</h1>
        <p>
          A doll whose heart glows when someone far away is there for you. One person has the
          doll; the other has this app. When you're both available, the heart fills and beats,
          on the phone and in the doll.
        </p>
        <a className="repo" href="https://github.com/rkdotxyz/DM2601/tree/main/prototype">How it's built →</a>
      </div>
      <div className="device">
        <div className="device-screen"><PhoneApp link={link} simulated /></div>
      </div>
      <DollPanel doll={doll} />
    </div>
  );
}
