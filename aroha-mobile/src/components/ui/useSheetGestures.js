import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, PanResponder, Platform } from 'react-native';

// Drag a sheet down to close it. Scroll areas inside keep their own drags
// (they claim the gesture first), so this only takes drags that start on the
// handle, header or other non-scrolling parts.
export function useSwipeToClose(onClose) {
  const drag = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
    onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 110 || g.vy > 0.9) {
        Keyboard.dismiss();
        closeRef.current?.();
      } else {
        Animated.spring(drag, { toValue: 0, useNativeDriver: true, tension: 90, friction: 12 }).start();
      }
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
  }), [drag]);

  return { panHandlers: responder.panHandlers, drag, resetDrag: () => drag.setValue(0) };
}

// How far a bottom sheet must rise to clear the keyboard. Measured against the
// keyboard's top edge, so it is right whether or not Android already resized
// the window (edge-to-edge builds don't), and never double-counts.
export function useKeyboardLift(containerRef) {
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, e => {
      const keyboardTop = e.endCoordinates.screenY;
      const node = containerRef.current;
      if (!node?.measureInWindow) { setLift(e.endCoordinates.height); return; }
      node.measureInWindow((x, y, w, h) => setLift(Math.max(0, Math.round(y + h - keyboardTop))));
    });
    const hide = Keyboard.addListener(hideEvt, () => setLift(0));
    return () => { show.remove(); hide.remove(); };
  }, [containerRef]);

  return lift;
}
