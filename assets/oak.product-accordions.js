// Oak: keep a product page accordion header where it was tapped while the accordion opens or closes.
// The accordions animate their height (element.accordion: 200ms size, then 200ms fade), so the scroll
// is corrected every frame until the layout settles. Scroll changes are instant, never smooth.
const SETTLE_MS = 700
const IDLE_FRAMES = 6

let run = null

function stop() {
  if (!run) return
  cancelAnimationFrame(run.frame)
  run = null
}

function track(summary) {
  stop()

  const startTop = summary.getBoundingClientRect().top
  const startTime = performance.now()
  let idle = 0

  const step = (now) => {
    if (!summary.isConnected) return stop()

    const delta = summary.getBoundingClientRect().top - startTop
    if (Math.abs(delta) >= 1) {
      window.scrollBy({ top: delta, behavior: 'instant' })
      idle = 0
    } else {
      idle++
    }

    if (now - startTime > SETTLE_MS && idle >= IDLE_FRAMES) return stop()
    run.frame = requestAnimationFrame(step)
  }

  run = { frame: requestAnimationFrame(step) }
}

document.addEventListener(
  'click',
  (event) => {
    const summary = event.target.closest('.product-single__meta accordion-toggle summary')
    if (summary) track(summary)
  },
  true
)

// Let the user take over if they scroll during the correction
for (const type of ['wheel', 'touchstart']) {
  window.addEventListener(type, stop, { passive: true })
}
