// Haptics. Android phones support navigator.vibrate(). iPhones don't, but
// Safari (iOS 18+) gives a light tap when a "switch" checkbox is toggled,
// so for taps we toggle a hidden one. That only works inside a tap.

let iosSwitch: HTMLLabelElement | null = null;

function iosTap() {
  if (!iosSwitch) {
    const label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.cssText = "position:fixed;left:-100px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

/** A light tap, for your own touches. Must be called inside a tap handler. */
export function tapFeel() {
  if (canVibrate) navigator.vibrate(12);
  else iosTap();
}

/** A lub-dub, for the heartbeat and the doll's Heart press (Android only). */
export function beatFeel(strong = true) {
  if (canVibrate) navigator.vibrate(strong ? [28, 110, 18] : [16, 120, 10]);
}
