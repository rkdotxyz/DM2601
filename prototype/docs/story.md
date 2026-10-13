# The story of the build

How the Heart Doll went from a course idea to a working v1.1, and the decisions on the way.

## Context

Heart Doll is the prototype for DM2601, a course in the Media Technology and Interaction Design programme at KTH. Our group's theme was **rituals**, and we focused on the pre-sleep rituals of people who have moved abroad for work or study. The direction we chose from our research was social interaction: staying close to people back home, across time zones, at the end of the day. (The research is in the [presentation](../../presentation).)

The prototype explores the social side of that ritual: a soft doll by the bed whose heart glows when someone far away is there for you, and a phone app for that someone.

## The approach

The build was split into phases, each adding one thing and ending with something visible on the doll or the phone. Hardware came first, with four tiny test sketches (colours, fades, buttons, WiFi), so the real firmware could be about behaviour only. The same rhythm (small step, visible check) had worked on my [ESP32 LED Snake](https://github.com/rkdotxyz/esp32-led-snake) build.

## Key decisions

**A state machine first, the network second.** The doll's behaviour was written as one function, `nextState()`, and run with the Serial Monitor standing in for the phone before any WiFi existed. When the real phone arrived, the rules didn't change. Later, when the rules themselves changed, nothing else did.

**The doll is the single source of truth.** The phone only sends requests and shows what the doll reports back. The LED and the app can't disagree, and a phone that opens late, or two phones at once, always show the same thing.

**No `delay()`.** Every light pattern is a function of time, so a heartbeat never blocks a button press or a message. It's the habit that made everything else possible on a single loop.

**A phone hotspot, not the university network.** eduroam's enterprise login is hard for an ESP32, so the demo runs on a 2.4 GHz phone hotspot. Local WiFi is a demo, not the product: the real story is people in different countries, which needs a cloud relay (planned).

## Designing the details

**Blue means one thing.** The doll uses red for people and blue only for "I'm offline", so "nobody is there" and "the doll lost WiFi" can never be confused.

**Every press is acknowledged.** A short white flash after Heart or Cross says the press registered and the message went out, even when nothing else changes.

**Tempo, then brightness.** v1.0 showed "both of you are here" as a slower, calmer 40 BPM heartbeat. v1.1 keeps one 60 BPM rhythm and changes its strength instead: 60% when only the phone person is there, 100% when both are, so "both" reads as more of the same signal. The phone app matches it with a heart that's half or completely full.

**"Not now" isn't "go away".** At first, Cross ended everything. That made the doll person's "not right now" switch the other person off too. In v1.1 each person's availability is their own: Cross darkens the doll but leaves the phone person available, and if they ask again, the doll shows them again.

**A heart that fills.** The phone app is drawn from my own sketch: two people joined to a heart by pipes. Each person fills half the heart, so it's only ever full when you're both there. The liquid fills from the bottom for you and drips in from the top for them, so the picture also says *who* arrived.

## What's next

The [roadmap](../README.md#roadmap): a heartbeat you can feel (haptics), sound and a recorded goodnight, robustness, and then into an actual doll, followed by a cloud relay and battery power.
