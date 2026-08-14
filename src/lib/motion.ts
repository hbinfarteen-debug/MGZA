import type { Transition } from 'framer-motion';

export const spring = {
  entrance: (delay = 0): Transition => ({
    type: 'spring',
    stiffness: 260,
    damping: 24,
    mass: 0.9,
    delay,
  }),
  switch: (): Transition => ({
    type: 'spring',
    stiffness: 320,
    damping: 26,
    mass: 0.8,
  }),
  hover: {
    scale: 1.03,
    transition: { type: 'spring', stiffness: 300, damping: 22, mass: 0.7 },
  } as const,
  press: {
    scale: 0.97,
    transition: { type: 'spring', stiffness: 400, damping: 20, mass: 0.7 },
  } as const,
};