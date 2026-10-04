// Minimal app-wide pub/sub, used when something logged from one place
// (e.g. the quick-log sheet) should refresh another screen (e.g. Home).
const listeners = {};

export function on(event, fn) {
  (listeners[event] ||= new Set()).add(fn);
  return () => listeners[event].delete(fn);
}

export function emit(event, payload) {
  listeners[event]?.forEach(fn => {
    try { fn(payload); } catch {}
  });
}
