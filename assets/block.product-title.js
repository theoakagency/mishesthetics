import { EVENTS } from 'util.events'

class VariantSku extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()

    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.handleVariantChange.bind(this),
      { signal: this.abortController.signal }
    )
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleVariantChange({ detail }) {
    const { html, sectionId, variant } = detail

    // No variant selected — clear the SKU.
    if (!variant) {
      this.innerHTML = ''
      return
    }

    // Loading state (no html yet) — leave the current markup in place.
    if (!html) return

    const skuSource = html.querySelector(`variant-sku[data-section-id="${sectionId}"]`)

    if (skuSource) {
      this.innerHTML = skuSource.innerHTML
    }
  }
}

customElements.define('variant-sku', VariantSku)
