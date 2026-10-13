// Where each person's liquid is, as one number per person, 0..2:
//
//   0      nothing: their tube is empty
//   0..1   liquid travelling down their tube towards the heart
//   1      their tube is full, at the heart
//   1..2   pouring into the heart, up to their half
//   2      their half of the heart is full
//
// Joining moves it up to 2, leaving moves it back to 0, at the speed of a
// real pour: the tube fills before the heart does, and on the way back the
// heart drains before the tube does. So the heart can never hold someone's
// liquid while their tube is empty, and a change of mind halfway simply
// turns the flow around from wherever it is.

export type Person = "them" | "you";

// Seconds for each leg of the journey.
const TUBE_IN_S = 0.85;
const HEART_IN_S = 1.5;
const HEART_OUT_S = 1.05;
const TUBE_OUT_S = 0.7;

export class Flow {
  progress: Record<Person, number> = { them: 0, you: 0 };
  target: Record<Person, number> = { them: 0, you: 0 };

  set(person: Person, here: boolean) {
    this.target[person] = here ? 2 : 0;
  }

  /** Jump straight to the end (reduced motion, or the first status). */
  settle() {
    this.progress.them = this.target.them;
    this.progress.you = this.target.you;
  }

  step(dt: number) {
    for (const p of ["them", "you"] as const) {
      const now = this.progress[p], to = this.target[p];
      if (now === to) continue;
      const up = to > now;
      const legS = up ? (now < 1 ? TUBE_IN_S : HEART_IN_S) : (now > 1 ? HEART_OUT_S : TUBE_OUT_S);
      let next = now + (up ? dt : -dt) / legS;
      // Stop exactly at the tube/heart boundary for one frame, so a leg
      // never borrows time from the next one.
      if ((now < 1 && next > 1) || (now > 1 && next < 1)) next = 1;
      this.progress[p] = up ? Math.min(next, to) : Math.max(next, to);
    }
  }

  /** How full the person's tube is, 0..1 (from their end). */
  tube(p: Person) { return Math.min(1, this.progress[p]); }

  /** Their share of the heart, 0..0.5 of its volume. */
  share(p: Person) { return Math.max(0, this.progress[p] - 1) * 0.5; }

  /** The heart's total fill, 0..1 by volume. */
  get level() { return this.share("them") + this.share("you"); }

  /** Is this person's liquid pouring into the heart right now? */
  pouring(p: Person) {
    const v = this.progress[p];
    return v > 1 && v < 2 && this.target[p] === 2;
  }

  get moving() {
    return this.progress.them !== this.target.them || this.progress.you !== this.target.you;
  }
}
