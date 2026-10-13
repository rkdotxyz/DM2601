# DM2601: Rituals

Everything for our DM2601 project at KTH (Media Technology and Interaction Design, HT26): the research presentation, the **Heart Doll** prototype, and the workbook.

**Theme:** pre-sleep rituals for people who have moved abroad for work or study.
**Group 11:** Ellen, Max, Rama Krushna and Roxanne.

## What's here

| Folder | What it is | Start with |
|---|---|---|
| [`presentation/`](presentation) | The project deck: target group, literature, interviews, persona, affinity analysis, direction and ideation. Plain HTML, no build step | Open `presentation/index.html` |
| [`prototype/`](prototype) | **Heart Doll:** an ESP32 doll whose heart glows when someone far away is there for you, with a phone app it serves itself. Firmware, wiring, parts list, build guide | [`prototype/README.md`](prototype/README.md) |
| [`workbook/`](workbook) | The project workbook (PDF), once it's ready | – |

## Quick start

**See the deck:**

```bash
git clone https://github.com/rkdotxyz/DM2601.git
open DM2601/presentation/index.html
```

(On Windows or Linux, open `presentation/index.html` in any browser.)

**Build the prototype:** you need an ESP32, an RGB LED, three resistors and two buttons. Follow [`prototype/README.md`](prototype/README.md), or the [step-by-step build guide](prototype/docs/guide/README.md) if you're new to this.

## Repo layout

```
presentation/   the slide deck (index.html, styles.css, script.js, images/), plus v1/, an earlier version
prototype/
  firmware/     heart_doll/ (the firmware) and tests/ (hardware bring-up sketches)
  hardware/     parts list and wiring diagram
  docs/         build guide, architecture, protocol, story, build log, gotchas
workbook/       the workbook PDF (coming)
```

## License

- **Code** (the firmware, test sketches and the deck's JavaScript): [MIT](LICENSE).
- **Everything else** (the presentation's content, documentation, diagrams and images): [CC BY 4.0](LICENSE-CC-BY-4.0.txt). Reuse it with credit to DM2601 Group 11.
