/*
  web_page.h  -  Heart Doll: the phone app (liquid heart)

  One small web page, stored inside the ESP32 and sent to any phone that
  opens http://heartdoll.local (or the doll's IP address).

  The whole screen is one picture, top to bottom:
      [ Them ]   the doll person
         ~       a squiggly pipe
      [ heart ]  a container that fills with liquid
         ~       a squiggly pipe
      [ You ]    the phone person: tap to switch available / unavailable

  - When someone becomes available, their pipe draws itself towards the
    heart (a "trim path" animation).
  - You (bottom) fill the heart from the bottom pipe: the level rises.
  - Them (top) fill it from the top pipe: drops fall in until the level
    is reached.
  - Each person fills half. Only when both are available is the heart
    full; then it glows and beats.
  - "Not now" (Cross on the doll) looks the same as not available.

  The doll is still the source of truth: tapping your avatar only sends a
  request ("app:available" / "app:unavailable"); the picture changes when
  the doll replies with its new "status:...".

  R"rawliteral( ... )rawliteral" is a C++ "raw string": everything between
  the brackets is kept exactly as written, so the HTML needs no escaping.
  PROGMEM keeps it in flash, not in RAM.
*/
#pragma once
#include <Arduino.h>

const char WEB_PAGE[] PROGMEM = R"rawliteral(<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f6f1ef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#171213" media="(prefers-color-scheme: dark)">
<title>Heart Doll</title>
<style>
  :root {
    --bg: #f6f1ef; --ink: #2a1f20; --muted: #8a7b7a; --line: #dccfcc;
    --heart: #c8324c; --empty: #efe5e3; --glow: rgba(200, 50, 76, .55); --ok: #2f8a5b;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #171213; --ink: #f3e9e7; --muted: #a8999a; --line: #433637;
      --heart: #ff4f6d; --empty: #231a1b; --glow: rgba(255, 79, 109, .6); --ok: #5fcf93;
      color-scheme: dark;
    }
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font: 15px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: max(14px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
    display: flex; flex-direction: column; align-items: center;
    -webkit-tap-highlight-color: transparent;
  }
  .link { align-self: flex-end; display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
  .link i { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
  body.online .link i { background: var(--ok); }

  .stage { flex: 1; width: 100%; display: grid; place-items: center; min-height: 0; }
  svg { display: block; width: auto; height: 100%; max-height: 78vh; max-width: 100%; overflow: visible; }
  svg text { font-family: inherit; font-size: 13px; fill: var(--muted); }

  /* pipes: a faint track, and a red copy drawn over it when available */
  .track { fill: none; stroke: var(--line); stroke-width: 3; stroke-linecap: round; }
  .pipe  { fill: none; stroke: var(--heart); stroke-width: 3.5; stroke-linecap: round; }

  /* avatars */
  .avatar circle.ring { fill: var(--bg); stroke: var(--line); stroke-width: 2.5; transition: fill .4s, stroke .4s; }
  .avatar .figure { fill: var(--muted); transition: fill .4s; }
  .avatar.on circle.ring { fill: var(--heart); stroke: var(--heart); }
  .avatar.on .figure { fill: #fff; }
  #you { cursor: pointer; outline: none; }
  #you:focus-visible circle.ring { stroke: var(--ink); stroke-width: 3.5; }
  #you:active { transform: scale(.95); transform-box: fill-box; transform-origin: center; }
  body:not(.online) #you { cursor: default; opacity: .5; }

  /* the heart */
  .shell { fill: var(--empty); }
  .outline { fill: none; stroke: var(--line); stroke-width: 3; transition: stroke .5s; }
  .liquid, .drop { fill: var(--heart); }
  .surface { fill: none; stroke: rgba(255, 255, 255, .35); stroke-width: 1.5; }
  .heartwrap { transform-box: fill-box; transform-origin: center; transition: filter .6s; }
  body.full .outline { stroke: var(--heart); }
  body.full .heartwrap { filter: drop-shadow(0 0 14px var(--glow)); animation: beat 1s ease-out infinite; }
  @keyframes beat {
    0%   { transform: scale(1); }
    12%  { transform: scale(1.08); }
    24%  { transform: scale(1); }
    36%  { transform: scale(1.04); }
    50%, 100% { transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) { body.full .heartwrap { animation: none; } }

  .hint { margin: 10px 0 0; color: var(--muted); font-size: 14px; text-align: center; min-height: 1.4em; }
</style>
</head>
<body>
  <div class="link" aria-live="polite"><i></i><span id="linkText">Connecting…</span></div>

  <div class="stage">
    <svg viewBox="0 0 240 560" role="img" aria-labelledby="summary">
      <title id="summary">Neither of you is available</title>
      <defs>
        <clipPath id="heartClip">
          <path id="heartShape" transform="translate(40 202.8) scale(1.6)"
                d="M50 88 C20 66 4 50 4 30 C4 15 15 4 29 4 C38 4 46 9 50 17 C54 9 62 4 71 4 C85 4 96 15 96 30 C96 50 80 66 50 88 Z"/>
        </clipPath>
        <g id="figure">
          <circle cx="0" cy="-10" r="10"/>
          <path d="M-20 24 C-20 8 20 8 20 24 Z"/>
        </g>
      </defs>

      <!-- pipes: each path starts at its avatar and ends at the heart -->
      <path class="track" d="M120 104 C150 124 90 144 120 164 S152 202 120 228"/>
      <path id="pipeTop" class="pipe" d="M120 104 C150 124 90 144 120 164 S152 202 120 228"/>
      <path class="track" d="M120 456 C90 436 150 418 120 398 S88 366 120 344"/>
      <path id="pipeBottom" class="pipe" d="M120 456 C90 436 150 418 120 398 S88 366 120 344"/>

      <!-- the heart: a container -->
      <g class="heartwrap">
        <use href="#heartShape" class="shell"/>
        <g clip-path="url(#heartClip)">
          <path id="liquid" class="liquid" d=""/>
          <path id="surface" class="surface" d=""/>
          <g id="drops"></g>
        </g>
        <use href="#heartShape" class="outline"/>
      </g>

      <!-- Them: the doll person -->
      <g id="them" class="avatar">
        <circle class="ring" cx="120" cy="64" r="40"/>
        <use href="#figure" class="figure" transform="translate(120 64)"/>
        <text x="172" y="68">Them</text>
      </g>

      <!-- You: the phone person. Tap to switch. -->
      <g id="you" class="avatar" role="button" tabindex="0" aria-label="You: unavailable. Tap to become available.">
        <circle class="ring" cx="120" cy="496" r="40"/>
        <use href="#figure" class="figure" transform="translate(120 496)"/>
        <text x="172" y="500">You</text>
      </g>
    </svg>
  </div>

  <p id="hint" class="hint">Tap your circle when you're available</p>

<script>
// ---------------------------------------------------------------------
// Geometry (SVG units, matching the drawing above)
// ---------------------------------------------------------------------
const HEART_TOP = 209.2;    // top of the heart's lobes
const HEART_TIP = 343.6;    // bottom tip of the heart
const HEART_LEFT = 46, HEART_RIGHT = 194;
const DROP_START_Y = 236;   // just inside the heart, under the top pipe

// The heart is wider at the top, so "half full" (half its area) sits at
// 59% of its height. This table turns area (0, 0.1 ... 1) into height.
const AREA_TO_HEIGHT = [0, .245, .353, .44, .519, .592, .664, .734, .806, .882, 1];

// Timing, in ms
const PIPE_MS = 700, PIPE_BACK_MS = 450, RISE_MS = 1100, DRIP_MS = 1500, DRAIN_MS = 900, DROP_EVERY_MS = 150;

const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const svgNS = "http://www.w3.org/2000/svg";

// ---------------------------------------------------------------------
// What we know, and what is currently drawn
// ---------------------------------------------------------------------
let themOn = false, youOn = false;      // from the doll's latest status
let online = false;
const view = { top: 0, bottom: 0, level: 0 };  // drawn values, 0..1
const tweens = {};                       // running animations, by name
let drops = [];                          // falling drops
let dripUntil = 0;                       // keep spawning drops until this time
let lastDropAt = 0;
let waveUntil = 0;                       // liquid surface ripples until this time
let running = false, lastFrame = 0;

const pipeTop = $("pipeTop"), pipeBottom = $("pipeBottom");
const lenTop = pipeTop.getTotalLength(), lenBottom = pipeBottom.getTotalLength();
pipeTop.style.strokeDasharray = lenTop;
pipeBottom.style.strokeDasharray = lenBottom;

// ---------------------------------------------------------------------
// The link to the doll
// ---------------------------------------------------------------------
let socket = null;

function connect() {
  setOnline(false, "Connecting…");
  socket = new WebSocket("ws://" + location.host + "/ws");
  socket.onopen = () => setOnline(true, "Connected");
  socket.onmessage = (e) => handle(String(e.data).trim());
  socket.onclose = () => { setOnline(false, "Doll offline"); setTimeout(connect, 2000); };
  socket.onerror = () => socket.close();
}

function send(message) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(message);
}

function handle(message) {
  if (message.startsWith("status:")) {
    const s = message.slice(7);
    if (!["idle", "waiting", "connected", "declined", "together"].includes(s)) return;
    // Them: available in waiting/together. You: available in connected,
    // declined ("not now" from them; you're still available) and together.
    update(s === "waiting" || s === "together",
           s === "connected" || s === "declined" || s === "together");
  } else if (message === "event:heart") {
    if (navigator.vibrate) navigator.vibrate([60, 50, 60]);   // Android only
  }
}

// ---------------------------------------------------------------------
// Turning a new status into animations
// ---------------------------------------------------------------------
function update(newThem, newYou) {
  const now = performance.now();
  const oldTarget = (themOn ? .5 : 0) + (youOn ? .5 : 0);
  const target = (newThem ? .5 : 0) + (newYou ? .5 : 0);
  const themJoined = newThem && !themOn, youJoined = newYou && !youOn;

  // 1. Pipes draw towards the heart, or pull back.
  if (newThem !== themOn) tween("top", newThem ? 1 : 0, newThem ? PIPE_MS : PIPE_BACK_MS, 0);
  if (newYou !== youOn) tween("bottom", newYou ? 1 : 0, newYou ? PIPE_MS : PIPE_BACK_MS, 0);

  // 2. The liquid. Rising waits for the pipe to reach the heart.
  if (target > oldTarget) {
    const fromTop = themJoined && !youJoined;   // only Them joined: drops from the top
    const ms = fromTop ? DRIP_MS : RISE_MS;
    tween("level", target, ms, PIPE_MS);
    waveUntil = now + PIPE_MS + ms + 600;
    if (fromTop && !reduceMotion) { dripUntil = now + PIPE_MS + ms; lastDropAt = 0; }
  } else if (target < oldTarget) {
    tween("level", target, DRAIN_MS, 0);
    waveUntil = now + DRAIN_MS + 600;
    dripUntil = 0;
  }

  themOn = newThem; youOn = newYou;
  drawAvatars();
  kick();
}

function tween(name, to, ms, delay) {
  if (reduceMotion) { view[name] = to; delete tweens[name]; return; }
  tweens[name] = { from: null, to, start: performance.now() + delay, ms };
}

// ---------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------
function heightFor(area) {
  const a = Math.max(0, Math.min(1, area)) * 10;
  const i = Math.min(9, Math.floor(a));
  return AREA_TO_HEIGHT[i] + (AREA_TO_HEIGHT[i + 1] - AREA_TO_HEIGHT[i]) * (a - i);
}

function surfaceY() {
  return HEART_TIP - heightFor(view.level) * (HEART_TIP - HEART_TOP);
}

function drawAvatars() {
  $("them").classList.toggle("on", themOn);
  $("you").classList.toggle("on", youOn);
  $("you").setAttribute("aria-label", youOn ? "You: available. Tap to become unavailable."
                                            : "You: unavailable. Tap to become available.");
  $("hint").textContent = !online ? "Waiting for the doll…"
                        : youOn ? "You're available · tap your circle to step away"
                        : "Tap your circle when you're available";
  $("summary").textContent = themOn && youOn ? "You're both available"
                           : themOn ? "They're available" : youOn ? "You're available"
                           : "Neither of you is available";
}

function drawFrame(now) {
  // pipes: show the drawn part of each path
  pipeTop.style.strokeDashoffset = lenTop * (1 - view.top);
  pipeBottom.style.strokeDashoffset = lenBottom * (1 - view.bottom);

  // liquid: a wavy top edge, clipped by the heart shape
  const y = surfaceY();
  const amp = now < waveUntil && !reduceMotion ? 2.2 * Math.min(1, (waveUntil - now) / 600) : 0;
  let top = "";
  for (let x = HEART_LEFT - 6; x <= HEART_RIGHT + 6; x += 6) {
    const yy = y + amp * Math.sin(x / 14 + now / 260);
    top += (top ? " L" : "M") + x.toFixed(1) + " " + yy.toFixed(2);
  }
  const empty = view.level <= 0.001;
  $("liquid").setAttribute("d", empty ? "" : top + ` L${HEART_RIGHT + 6} ${HEART_TIP + 4} L${HEART_LEFT - 6} ${HEART_TIP + 4} Z`);
  $("surface").setAttribute("d", empty || view.level >= 0.999 ? "" : top);

  // drops
  const g = $("drops");
  while (g.firstChild) g.removeChild(g.firstChild);
  for (const d of drops) {
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("class", "drop");
    c.setAttribute("cx", d.x); c.setAttribute("cy", d.y); c.setAttribute("r", 3.4);
    g.appendChild(c);
  }

  // full = both available AND the liquid has reached the top
  document.body.classList.toggle("full", themOn && youOn && view.level >= 0.999);
}

// ---------------------------------------------------------------------
// The animation loop: runs only while something is moving
// ---------------------------------------------------------------------
function kick() {
  if (!running) { running = true; lastFrame = performance.now(); requestAnimationFrame(frame); }
}

function frame(now) {
  const dt = Math.min(50, now - lastFrame) / 1000;
  lastFrame = now;

  // advance tweens (ease in-out)
  for (const name of Object.keys(tweens)) {
    const t = tweens[name];
    if (now < t.start) continue;
    if (t.from === null) t.from = view[name];
    const p = Math.min(1, (now - t.start) / t.ms);
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    view[name] = t.from + (t.to - t.from) * e;
    if (p >= 1) delete tweens[name];
  }

  // spawn drops from the top pipe while filling from the top
  if (now < dripUntil && tweens.level && now >= tweens.level.start && now - lastDropAt > DROP_EVERY_MS) {
    drops.push({ x: 120 + (Math.random() * 6 - 3), y: DROP_START_Y, v: 40 });
    lastDropAt = now;
  }
  // drops fall (gravity) and vanish into the liquid
  const floor = surfaceY();
  drops = drops.filter((d) => { d.v += 900 * dt; d.y += d.v * dt; return d.y < floor - 1; });

  drawFrame(now);

  const busy = Object.keys(tweens).length || drops.length || now < dripUntil || now < waveUntil;
  if (busy) requestAnimationFrame(frame); else running = false;
}

// ---------------------------------------------------------------------
// Small helpers and start-up
// ---------------------------------------------------------------------
function setOnline(on, label) {
  online = on;
  document.body.classList.toggle("online", on);
  $("linkText").textContent = label;
  drawAvatars();
}

function toggleMe() {
  if (!online) return;
  send(youOn ? "app:unavailable" : "app:available");
}

$("you").addEventListener("click", toggleMe);
$("you").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMe(); }
});

drawAvatars();
drawFrame(performance.now());
connect();
</script>
</body>
</html>
)rawliteral";
