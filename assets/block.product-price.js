import { EVENTS } from 'util.events'

class BlockPrice extends HTMLElement {
  constructor() {
    super()

    this.handleVariantChange = this.handleVariantChange.bind(this)
  }
  connectedCallback() {
    this.abortController = new AbortController()

    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.handleVariantChange,
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleVariantChange({ detail }) {
    const { html, variant } = detail

    if (!variant || !html) return

    const priceSourceBlock = html.querySelector(
      `block-price[data-section-id="${this.dataset.sectionId}"][data-product-id="${this.dataset.productId}"]`
    )

    if (!priceSourceBlock) {
      return
    }

    // Replace inner layout stack content to ensure markup and internal attributes update
    const srcStack = priceSourceBlock.querySelector('layout-stack')
    const destStack = this.querySelector('layout-stack')

    if (srcStack && destStack) {
      destStack.outerHTML = srcStack.outerHTML
    } else {
      // Fallback to previous behavior: swap the first div
      const priceSource = priceSourceBlock.querySelector('div')
      const priceDestination = this.querySelector('div')
      if (priceSource && priceDestination) {
        priceDestination.outerHTML = priceSource.outerHTML
      }
    }

    // Sync relevant data-* attributes on the host so CSS selectors like [data-on-sale] work
    const dataAttrs = ['data-on-sale', 'data-unit-price', 'data-sold-out']
    for (const attr of dataAttrs) {
      if (priceSourceBlock.hasAttribute(attr)) {
        this.setAttribute(attr, '')
      } else {
        this.removeAttribute(attr)
      }
    }
  }
}

customElements.define('block-price', BlockPrice)
