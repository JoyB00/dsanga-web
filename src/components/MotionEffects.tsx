'use client'

import { useEffect } from 'react'

/**
 * Interactive motion on top of server-rendered pages (one instance in the locale layout):
 *
 * - Each block of a page section (`.reveal-children > *`, see Section.tsx) and each item of a
 *   `data-stagger` list rises in once, the first time it scrolls into view on a page visit. After
 *   that it stays put: scrolling back up shows the content normally, with no animation.
 *   Items a catalogue filter brings in play once more, as feedback for the click.
 * - `data-tilt` on a card: tilts towards a fine pointer, with a light glare (CSS in globals.css).
 *
 * Progressive: content is visible without JavaScript; items already on screen when this runs are
 * never hidden. Only opacity and transform move (Web Animations API, composited). Nothing runs
 * with prefers-reduced-motion. Motion (about 6 kB gzipped) loads in its own chunk after the page
 * is interactive, so it adds nothing to the first load.
 */

type MotionLib = typeof import('@/lib/motion-lite')

export function MotionEffects() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const stopTilt = matchMedia('(hover: hover) and (pointer: fine)').matches ? startTilt() : null
    let stopReveal: VoidFunction | undefined
    let cancelled = false
    import('@/lib/motion-lite')
      .then((motion) => {
        if (!cancelled) stopReveal = startReveal(motion)
      })
      // Without the animation library the page simply stays static.
      .catch(() => {})
    return () => {
      cancelled = true
      stopReveal?.()
      stopTilt?.()
    }
  }, [])
  return null
}

/** Hidden start of each kind: list items also scale a little; large blocks only rise. */
const KINDS = {
  block: { selector: 'main .reveal-children > :not([data-stagger])', from: 'translateY(32px)' },
  item: { selector: 'main [data-stagger] > *', from: 'translateY(28px) scale(0.97)' },
} as const
type Kind = keyof typeof KINDS

function onScreen(el: Element) {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && r.width > 0
}

function show(el: HTMLElement) {
  el.style.removeProperty('opacity')
  el.style.removeProperty('transform')
}

function hide(el: HTMLElement, kind: Kind) {
  el.getAnimations().forEach((a) => a.cancel())
  el.style.opacity = '0'
  el.style.transform = KINDS[kind].from
}

function startReveal({ animateMini: animate, inView, spring, stagger }: MotionLib) {
  const SPRING = { type: spring, visualDuration: 0.55, bounce: 0.18 }
  /** Every element handled on this page visit; each plays at most once. */
  const seen = new WeakSet<HTMLElement>()
  /** Elements still waiting off screen for their one entry. */
  const waiting = new Map<HTMLElement, VoidFunction>()
  const queues: Record<Kind, Set<HTMLElement>> = { block: new Set(), item: new Set() }
  let frame = 0

  // Elements entering in the same frame play together, one after another in page order.
  const flush = () => {
    frame = 0
    for (const kind of Object.keys(queues) as Kind[]) {
      const els = [...queues[kind]].filter((el) => el.isConnected)
      queues[kind].clear()
      if (!els.length) continue
      try {
        animate(
          els,
          { opacity: [0, 1], transform: [KINDS[kind].from, 'none'] },
          { ...SPRING, delay: stagger(0.07) },
        ).then(
          () => els.forEach(show),
          () => els.forEach(show),
        )
      } catch {
        // Never leave content hidden because an animation could not start.
        els.forEach(show)
      }
    }
  }

  // A fast fling can skip past an element without it ever intersecting. Once it is above the
  // screen it is shown as is, so scrolling back up never plays anything.
  let checking = 0
  const passed = () => {
    checking = 0
    for (const [el, stop] of waiting) {
      if (el.getBoundingClientRect().bottom < 0) {
        stop()
        waiting.delete(el)
        show(el)
      }
    }
  }
  const onScroll = () => {
    if (waiting.size) checking ||= requestAnimationFrame(passed)
  }
  addEventListener('scroll', onScroll, { passive: true })

  const play = (el: HTMLElement, kind: Kind) => {
    hide(el, kind)
    queues[kind].add(el)
    frame ||= requestAnimationFrame(flush)
  }

  const watch = (el: HTMLElement, kind: Kind, playIfVisible: boolean) => {
    if (seen.has(el)) return
    seen.add(el)
    if (onScreen(el)) {
      // Painted at page load: leave it. Added later (navigation, filter): play now, before paint.
      if (playIfVisible) play(el, kind)
      return
    }
    hide(el, kind)
    const stop = inView(el, () => {
      stop()
      waiting.delete(el)
      play(el, kind)
    })
    waiting.set(el, stop)
  }

  const scan = (playIfVisible: boolean) => {
    for (const [el, stop] of waiting) {
      if (!el.isConnected) {
        stop()
        waiting.delete(el)
      }
    }
    for (const kind of Object.keys(KINDS) as Kind[]) {
      document.querySelectorAll<HTMLElement>(KINDS[kind].selector).forEach((el) => watch(el, kind, playIfVisible))
    }
  }

  scan(false)
  // Runs as a microtask after React commits, before the browser paints, so new content never flashes.
  const observer = new MutationObserver((records) => {
    scan(true)
    // A list whose items changed in place (catalogue filter): play the items on screen once more.
    for (const { target } of records) {
      if (target instanceof HTMLElement && target.matches('[data-stagger]')) {
        for (const item of target.children) {
          if (item instanceof HTMLElement && onScreen(item) && !waiting.has(item)) play(item, 'item')
        }
      }
    }
  })
  const main = document.querySelector('main')
  if (main) observer.observe(main, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    removeEventListener('scroll', onScroll)
    cancelAnimationFrame(frame)
    cancelAnimationFrame(checking)
    waiting.forEach((stop) => stop())
  }
}

function startTilt() {
  let card: HTMLElement | null = null
  let x = 0
  let y = 0
  let frame = 0

  const reset = (el: HTMLElement | null) => {
    el?.style.removeProperty('--tilt-x')
    el?.style.removeProperty('--tilt-y')
  }
  const apply = () => {
    frame = 0
    if (!card) return
    const r = card.getBoundingClientRect()
    const px = Math.min(Math.max((x - r.left) / r.width, 0), 1)
    const py = Math.min(Math.max((y - r.top) / r.height, 0), 1)
    card.style.setProperty('--tilt-x', `${((0.5 - py) * 7).toFixed(2)}deg`)
    card.style.setProperty('--tilt-y', `${((px - 0.5) * 9).toFixed(2)}deg`)
    card.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`)
    card.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`)
  }
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const next = (e.target as Element | null)?.closest?.<HTMLElement>('[data-tilt]') ?? null
    if (next !== card) {
      reset(card)
      card = next
    }
    if (!card) return
    x = e.clientX
    y = e.clientY
    frame ||= requestAnimationFrame(apply)
  }
  const leave = (e: PointerEvent) => {
    if (!e.relatedTarget) {
      reset(card)
      card = null
    }
  }

  document.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerout', leave, { passive: true })
  return () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerout', leave)
    cancelAnimationFrame(frame)
    reset(card)
  }
}
