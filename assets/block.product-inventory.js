import { EVENTS } from 'util.events'

class ProductInventory extends HTMLElement {
  constructor() {
    super()

    this.classes = {
      hidden: 'hide'
    }

    this.selectors = {
      points: '.product-inventory__points'
    }

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
    const { html, variant, loading } = detail

    if (loading) return

    if (!variant) {
      this.classList.add(this.classes.hidden)
      return
    }

    if (!html) return

    const source = html.querySelector(
      `product-inventory[data-section-id="${this.dataset.sectionId}"][data-product-id="${this.dataset.productId}"]`
    )

    if (!source) return

    // Adopt the new inventory markup.
    const srcPoints = source.querySelector(this.selectors.points)
    const destPoints = this.querySelector(this.selectors.points)

    if (srcPoints && destPoints) {
      destPoints.outerHTML = srcPoints.outerHTML
    }

    // Sync the host visibility class computed server-side.
    this.classList.toggle(this.classes.hidden, source.classList.contains(this.classes.hidden))
  }
}

customElements.define('product-inventory', ProductInventory)
