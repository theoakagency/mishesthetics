import CartForm from 'module.cart-form'
import { EVENTS } from 'util.events'

class HeaderCart extends HTMLElement {
  constructor() {
    super()

    this.form = this.querySelector('form')
    this.cartType = this.getAttribute('cart-type')
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  connectedCallback() {
    this.abortController = new AbortController()

    this.cartForm = new CartForm(this.form)
    this.cartForm.buildCart()

    document.addEventListener(EVENTS.ajaxProductAdded, this.handleCartChange.bind(this), {
      signal: this.abortController.signal
    })
  }

  async handleCartChange(evt) {
    this.cartForm.cartMarkup(evt.detail.product.sections['cart-ajax'])

    if (!evt?.detail?.preventCartOpen && this.cartType === 'dropdown') {
      this.dispatchEvent(new CustomEvent(EVENTS.cartOpen, { bubbles: true }))
    }

    // Resets cart property so that the form submit button can work
    if (this.cartForm.cartItemsUpdated) {
      this.cartForm.cartItemsUpdated = false
    }
  }
}

customElements.define('header-cart-drawer', HeaderCart)
