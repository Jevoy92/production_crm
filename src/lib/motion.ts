/**
 * Shared Framer Motion (package: "motion") presets for Palmer House OS.
 * Keeping easings/durations/variants here makes motion uniform across the app.
 * Mirrors the CSS easings declared in styles.css (--ph-ease, --ph-ease-out).
 */
import type { Variants, Transition } from "motion/react";

/** Premium ease-out (matches CSS --ph-ease). */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const DUR = {
  fast: 0.18,
  base: 0.32,
  slow: 0.5,
} as const;

export const spring = {
  soft: { type: "spring", stiffness: 320, damping: 30, mass: 0.8 },
  snappy: { type: "spring", stiffness: 460, damping: 34 },
  gentle: { type: "spring", stiffness: 180, damping: 26 },
} satisfies Record<string, Transition>;

/** Fade + rise — the default entrance for cards and sections. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring.soft },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: spring.soft },
  exit: { opacity: 0, x: 24, transition: { duration: DUR.fast, ease: EASE } },
};

/** Container that staggers its children's entrance. */
export const staggerContainer = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** Standard route-transition variants for the page Outlet. */
export const routeVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE } },
};
