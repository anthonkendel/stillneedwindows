import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Animates a number towards its target (ease-out). Jumps straight there with reduced motion. */
export function useCountUp(target: Ref<number>, duration = 900) {
  const shown = ref(0)
  let frame = 0

  watch(
    target,
    (to) => {
      cancelAnimationFrame(frame)
      if (reducedMotion()) {
        shown.value = to
        return
      }
      const from = shown.value
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration)
        shown.value = Math.round(from + (to - from) * (1 - (1 - p) ** 3))
        if (p < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => cancelAnimationFrame(frame))
  return shown
}
