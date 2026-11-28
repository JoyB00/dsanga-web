/**
 * The only Motion functions the site uses, loaded together in one small chunk by
 * src/components/MotionEffects.tsx. Named re-exports keep the rest of the library out of the bundle.
 */
export { inView, spring, stagger } from 'motion'
export { animate as animateMini } from 'motion/mini'
