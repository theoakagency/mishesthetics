import { debounce } from 'util.misc'

class ElementMarquee extends HTMLElement {
  constructor() {
    super()
    this.resizeObserver = null
    this.hasResizedOnce = false
    this.lastWidth = 0
    this.elements = {}
  }

  connectedCallback() {
    this.elements.content = this.querySelector('.element-marquee__content')
    this.elements.wrapper = this.querySelector('.element-marquee__wrapper')

    if (!this.elements.content || !this.elements.content.firstElementChild?.children?.length) return

    this.setupContent()
    this.setSpeed()
    this.setupHover()
    this.setupResizeObserver()

    this.setAttribute('data-loaded', '')
  }

  disconnectedCallback() {
    this.cleanupResizeObserver()
  }

  setupContent() {
    const copies = this.calculateNumberOfCopies()

    // Remove existing duplicates first
    const allContainers = [...this.elements.content.children]
    allContainers.slice(1).forEach((container) => container.remove())

    // Clone the original container for each copy needed
    const originalContainer = this.elements.content.firstElementChild
    for (let i = 1; i < copies; i++) {
      const clone = originalContainer.cloneNode(true)
      this.elements.content.appendChild(clone)
    }

    this.duplicateContent()
  }

  calculateNumberOfCopies() {
    const containerWidth = this.offsetWidth
    const itemsContainer = this.elements.content.firstElementChild
    const itemWidth = itemsContainer instanceof HTMLElement ? itemsContainer.offsetWidth : 1

    return itemWidth === 0 ? 1 : Math.ceil(containerWidth / itemWidth) + 1
  }

  duplicateContent() {
    if (!this.elements.wrapper || !this.elements.content) return

    const existingClone = this.elements.wrapper.querySelector('.element-marquee__content[aria-hidden="true"]')
    if (existingClone) existingClone.remove()

    const clone = this.elements.content.cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    this.elements.wrapper.appendChild(clone)
  }

  setSpeed() {
    const basePixelsPerSecond = 50
    const speedMultiplier = parseInt(this.getAttribute('data-speed')) || 5
    const pixelsPerSecond = basePixelsPerSecond * (speedMultiplier / 5)

    const containerWidth = this.offsetWidth
    const duration = containerWidth / pixelsPerSecond

    this.style.setProperty('--marquee-speed', `${duration}s`)
  }

  setupHover() {
    const smoothTransition = (targetRate) => {
      const animation = this.elements.wrapper?.getAnimations()[0]
      if (!animation) return

      const start = animation.playbackRate
      const duration = 300
      const startTime = performance.now()

      const animate = (time) => {
        const progress = Math.min((time - startTime) / duration, 1)
        const rate = start + (targetRate - start) * progress
        animation.updatePlaybackRate(rate)

        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }

    this.addEventListener('pointerenter', () => smoothTransition(0))
    this.addEventListener('pointerleave', () => smoothTransition(1))
  }

  setupResizeObserver() {
    this.lastWidth = this.offsetWidth

    this.resizeObserver = new ResizeObserver(debounce(250, () => this.handleResize()))
    this.resizeObserver.observe(this)
  }

  cleanupResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  }

  handleResize() {
    if (!this.hasResizedOnce) {
      this.hasResizedOnce = true
      return
    }

    const currentWidth = this.offsetWidth
    const widthChange = Math.abs(currentWidth - this.lastWidth) / this.lastWidth

    // Only recalculate if width changed by more than 20%
    if (widthChange > 0.2) {
      this.setupContent()
      this.setSpeed()
      this.lastWidth = currentWidth
    }
  }
}

customElements.define('element-marquee', ElementMarquee)
