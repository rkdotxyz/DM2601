# Presentation

The DM2601 project deck: **Rituals**, pre-sleep rituals for people who have moved abroad for work or study. Group 11: Ellen, Max, Rama Krushna and Roxanne.

A plain HTML, CSS and JavaScript slide deck with no build step and no dependencies apart from two Google Fonts (Fraunces and Inter).

## View it

Open `index.html` in a browser. Everything works from the file, except the fonts when you're offline.

Or serve the folder locally, which is what `.claude/launch.json` does for Claude Code's preview:

```bash
cd presentation
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Controls

| Action | Keys |
|---|---|
| Next slide | → ↓ Space Page Down, or the next button |
| Previous slide | ← ↑ Page Up, or the previous button |
| First / last slide | Home / End |
| Touch | Swipe left or right |

## The slides

1. **Rituals:** title, group and course
2. **Habit, Routine & Ritual:** the three terms, compared
3. **Target User Group, exploring:** every group we proposed
4. **Target User Group, finalizing:** narrowing down to people who have moved abroad
5. **High Level Ritual Domain:** the pre-sleep rituals that might be in play
6. **Literature Review:** twelve papers on sleep technology, habit and ritual
7. **User Interview, plan:** four areas for semi-structured interviews
8. **User Interview, participants:** nine people who moved country, mapped
9. **Persona:** Marie, 24, from Seoul, working in Stockholm
10. **Research Findings:** the notes from the interviews
11. **Data Analysis, affinity diagramming:** the notes sorted into themes
12. **Direction, social interaction:** a scenario from Marie's evening
13. **Point of View**
14. **How Might We**
15. **Brainstorming:** ideas from worst-possible-idea, brainstorming, Crazy 8s and sketching
16. **What Next?:** more ideation, then a couple of ideas carried forward
17. **Thank You:** questions and feedback

A small double diamond in the corner tracks where each slide sits in the design process: it opens through the research, closes at the direction, and opens again for ideation.

## Files

```
index.html        the slides, one <section class="slide"> each
styles.css        layout, type and the slide transitions
script.js         navigation, the double-diamond progress, the affinity-note animation
favicon.svg
images/           persona photo, world map for the participants slide
v1/               an earlier version of the deck, kept for reference
```

### `v1/`

A complete, self-contained copy of the deck as it was on 2026-09-29, before it was trimmed to one design direction and the point-of-view and "how might we" slides were added. It has its own `index.html`, styles and images, and opens the same way. The current deck doesn't depend on it.

## License

[CC BY 4.0](../LICENSE-CC-BY-4.0.txt), © 2026 DM2601 Group 11 (Ellen, Max, Rama Krushna, Roxanne). The code in `script.js` is also available under [MIT](../LICENSE).
