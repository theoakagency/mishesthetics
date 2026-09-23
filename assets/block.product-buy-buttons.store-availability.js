import Modals from 'module.modal'
import { EVENTS } from 'util.events'
import Drawers from 'block.product-buy-buttons.drawers'
import { executeJSmodules } from 'util.misc'

class StoreAvailability extends HTMLElement {
  constructor() {
    super()

    this.selectors = {
      drawerOpenBtn: '.js-drawer-open-availability',
      modalOpenBtn: '.js-modal-open-availability',
      productTitle: '[data-availability-product-title]'
    }

    this.baseUrl = this.dataset.baseUrl
    this.productTitle = this.dataset.productName
    this.variantId = this.dataset.variantId
  }

  connectedCallback() {
    this.abortController = new AbortController()

    if (this.hasAttribute('data-available')) {
      this.updateContent(this.variantId)
    }

    document.addEventListener(
      `${EVENTS.variantChange}:${this.dataset.sectionId}:${this.dataset.productId}`,
      this.handleVariantChange.bind(this),
      { signal: this.abortController.signal }
    )
  }

  handleVariantChange({ detail }) {
    const { variant, loading } = detail

    if (loading) return

    if (!variant?.available) {
      this.contentAbortController?.abort()
      this.innerHTML = ''
      return
    }

    this.updateContent(variant.id)
  }

  updateContent(variantId) {
    const variantSectionUrl = `${this.baseUrl}/variants/${variantId}/?section_id=store-availability`

    // Rapid selections queue independent fetches with no ordering guarantee; drop the
    // in-flight one so the newest selection is always what renders.
    this.contentAbortController?.abort()
    this.contentAbortController = new AbortController()

    fetch(variantSectionUrl, { signal: this.contentAbortController.signal })
      .then((response) => {
        return response.text()
      })
      .then((html) => {
        if (html.trim() === '') {
          this.innerHTML = ''
          return
        }

        this.innerHTML = html
        this.innerHTML = this.firstElementChild.innerHTML

        // Setup drawer if have open button
        if (this.querySelector(this.selectors.drawerOpenBtn)) {
          this.drawer = new Drawers('StoreAvailabilityDrawer', 'availability')
        }

        // Setup modal if have open button
        if (this.querySelector(this.selectors.modalOpenBtn)) {
          this.modal = new Modals('StoreAvailabilityModal', 'availability')
        }

        const title = this.querySelector(this.selectors.productTitle)
        if (title) {
          title.textContent = this.productTitle
        }

        const scripts = this.querySelectorAll('script[type="module"]')
        if (scripts.length) {
          executeJSmodules(scripts)
        }
      })
      .catch((error) => {
        // A superseded request is expected; anything else is worth surfacing.
        if (error.name !== 'AbortError') console.error(error)
      })
  }
}

customElements.define('store-availability', StoreAvailability)
