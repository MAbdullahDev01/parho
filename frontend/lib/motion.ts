import type { Transition, Variants } from "motion/react";

export const spring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 22,
};

export const stampSpring: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 16,
  mass: 0.9,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export const stagger = (delay = 0.09): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: delay, delayChildren: 0.05 },
  },
});

export const revealClip: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0 },
  show: {
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] },
  },
};

export const stampIn: Variants = {
  hidden: { opacity: 0, scale: 2.1, rotate: -14 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: -6,
    transition: { ...stampSpring, delay: 0.55 },
  },
};

export const viewport = { once: true, margin: "-80px" };
