import { TouchEvent, useState } from "react";

import { vibrate } from "@utilities/haptics";

interface SwipeInput {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
}

interface SwipeOutput {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

// https://stackoverflow.com/a/75060088
export default (input: SwipeInput): SwipeOutput => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(0); // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      vibrate("tap");
      input?.onSwipedLeft?.();
    }
    if (isRightSwipe) {
      vibrate("tap");
      input?.onSwipedRight?.();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
