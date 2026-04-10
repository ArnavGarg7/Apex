// src/utils/motionPrefs.js
export const reducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

/**
 * Run fullFn unless user prefers reduced motion, in which case run reducedFn.
 */
export function ifMotion(fullFn, reducedFn = () => {}) {
  return reducedMotion ? reducedFn() : fullFn();
}

/**
 * Returns motion-safe variants for Framer Motion.
 * Usage: <motion.div variants={motionVariants(initial, animate)} />
 */
export function motionVariants(initial, animate, exit = {}) {
  if (reducedMotion) {
    return {
      initial: {},
      animate: {},
      exit: {},
    };
  }
  return { initial, animate, exit };
}
