export type PressMotionKind = 'cta' | 'card' | 'icon' | 'hero-icon' | 'text';
export type BubbleMotionKind = 'user' | 'ai' | 'debug';

export function getPressMotionPreset(kind: PressMotionKind) {
  if (kind === 'hero-icon') {
    return {
      pressedScale: 0.88,
      translateY: -3,
      disabledOpacity: 0.4,
      releaseSpring: { damping: 12, stiffness: 240 },
    };
  }

  if (kind === 'icon') {
    return {
      pressedScale: 0.92,
      translateY: -1,
      disabledOpacity: 0.4,
      releaseSpring: { damping: 14, stiffness: 220 },
    };
  }

  if (kind === 'cta') {
    return {
      pressedScale: 0.96,
      translateY: -1,
      disabledOpacity: 0.45,
      releaseSpring: { damping: 16, stiffness: 210 },
    };
  }

  if (kind === 'text') {
    return {
      pressedScale: 0.98,
      translateY: 0,
      disabledOpacity: 0.45,
      releaseSpring: { damping: 18, stiffness: 200 },
    };
  }

  return {
    pressedScale: 0.97,
    translateY: 0,
    disabledOpacity: 0.4,
    releaseSpring: { damping: 18, stiffness: 200 },
  };
}

export function getBubbleMotionPreset(kind: BubbleMotionKind) {
  if (kind === 'user') {
    return { fromX: 12, fromY: 6, duration: 220 };
  }

  if (kind === 'debug') {
    return { fromX: 0, fromY: 6, duration: 180 };
  }

  return { fromX: 0, fromY: 14, duration: 260 };
}

export function getPhaseMotionPreset() {
  return { fromY: 12, duration: 220 };
}

export function getTabCenterMotionPreset() {
  return {
    focusedLift: -6,
    pulseScale: 1.06,
    pressScale: 0.88,
    pressDepth: -4,
    releaseSpring: { damping: 11, stiffness: 250 },
  };
}
