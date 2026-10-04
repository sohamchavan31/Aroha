// Thin wrapper around expo-haptics.
// expo-haptics is a native module: on a dev client built before it was added,
// requiring it throws. In that case every call quietly becomes a no-op
// until the next EAS dev build.
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch {
  Haptics = null;
}

function run(fn) {
  if (!Haptics) return;
  try {
    fn(Haptics).catch(() => {});
  } catch {}
}

// Light tick — logging something, toggling, tab change.
export function tap() {
  run(h => h.selectionAsync());
}

// Firm press — primary actions.
export function press() {
  run(h => h.impactAsync(h.ImpactFeedbackStyle.Medium));
}

// Celebration — mission complete, PR, stage-up.
export function success() {
  run(h => h.notificationAsync(h.NotificationFeedbackType.Success));
}

export function warn() {
  run(h => h.notificationAsync(h.NotificationFeedbackType.Warning));
}
