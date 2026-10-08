// The wheel picker's tick: a light haptic plus a short click sound.
// expo-audio is a native module: on a dev build made before it was added,
// requiring it throws, and the tick is haptic-only until the next build.
import { tap } from './haptics';

let Audio = null;
try {
  Audio = require('expo-audio');
} catch {
  Audio = null;
}

const POOL = 3;          // a few players so fast scrolling doesn't cut clicks off
let players = null;
let next = 0;
let last = 0;

function ensurePlayers() {
  if (players || !Audio) return players;
  try {
    Audio.setAudioModeAsync?.({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch?.(() => {});
    players = Array.from({ length: POOL }, () => {
      const p = Audio.createAudioPlayer(require('../../assets/sounds/tick.wav'));
      p.volume = 0.35;
      return p;
    });
  } catch {
    players = null;
    Audio = null;
  }
  return players;
}

export function tick() {
  const now = Date.now();
  if (now - last < 28) return; // a very fast fling still sounds like ticks, not a buzz
  last = now;
  tap();
  const ps = ensurePlayers();
  if (!ps) return;
  try {
    const p = ps[next];
    next = (next + 1) % ps.length;
    p.seekTo(0);
    p.play();
  } catch {}
}
