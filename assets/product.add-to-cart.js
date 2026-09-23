import { EVENTS } from 'util.events'
import { trapFocus, removeTrapFocus } from 'util.a11y'

const classes = {
  isAdded: 'is-added'
}

class AddToCart extends HTMLElement {
  connectedCallback() {
    this.qtySelector = this.querySelector('quantity-selector')
    this.qtySelectorInput = this.qtySelector?.querySelector('input[name="quantity"]')
    this.button = this.querySelector('.js-add-to-cart')
    this.successMessage = this.querySelector('.js-added')
    this.abortController = new AbortController()
    this.variantId = this.dataset.variantId
    this.changingQuantity = false
    this.smallContainer = false
    this.activeElement = null
    this.isHovering = false
    this.count = this.getAttribute('data-count') ? parseInt(this.getAttribute('data-count')) : 0
    this.container = this.closest('.product-grid-item')
    this.debounceTimeout = null
    this.pendingQuantity = null

    if (!this.button || !this.qtySelector) return

    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this))
    if (!this.count && this.container) this.resizeObserver.observe(this.container)

    this.qtySelector.addEventListener('quantity:change', this.handleQuantityChange.bind(this), {
      signal: this.abortController.signal
    })

    this.addEventListener(
      'mouseover',
      () => {
        this.isHovering = true
        this.open()
      },
      {
        signal: this.abortController.signal
      }
    )

    this.addEventListener(
      'mouseout',
      () => {
        this.isHovering = false
        this.close()
      },
      {
        signal: this.abortController.signal
      }
    )

    this.button.addEventListener(
      'click',
      () => {
        if (this.button.classList.contains('at-add-to-cart__button--add')) {
          this.changeQuantity(1)
          this.qtySelectorInput.value = 1
        }
        this.button.getAttribute('aria-expanded') == 'false' ? this.open() : this.close()
      },
      {
        signal: this.abortController.signal
      }
    )

    this.addEventListener(
      'focusout',
      (evt) => (!this.contains(evt.relatedTarget) || !this.contains(evt.target)) && this.close(),
      {
        signal: this.abortController.signal
      }
    )

    this.addEventListener('keydown', (evt) => evt.key === 'Escape' && this.close(), {
      signal: this.abortController.signal
    })

    document.addEventListener(EVENTS.cartUpdated, this.handleCartUpdated.bind(this), {
      signal: this.abortController.signal
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
  }

  open() {
    const currentQuantity = this.qtySelectorInput ? parseInt(this.qtySelectorInput.value) || 0 : this.count
    if (!this.button || currentQuantity > 0 || this.smallContainer) return
    this.button.setAttribute('aria-expanded', 'true')
    this.classList.remove(classes.isAdded)
    if (this.contains(document.activeElement)) {
      this.qtySelectorInput.focus()
    }
  }

  close() {
    const currentQuantity = this.qtySelectorInput ? parseInt(this.qtySelectorInput.value) || 0 : this.count
    if (!this.button || this.changingQuantity || currentQuantity > 0 || this.smallContainer) return
    this.button.setAttribute('aria-expanded', 'false')
    if (this.activeElement) this.activeElement.focus()
  }

  async handleQuantityChange({ detail }) {
    if (this.contains(document.activeElement)) this.activeElement = document.activeElement

    this.changeQuantity(detail.qty)
  }

  changeQuantity(quantity) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    this.changingQuantity = true
    this.pendingQuantity = quantity

    this.debounceTimeout = setTimeout(async () => {
      const previousQuantity = this.qtySelectorInput
        ? parseInt(this.qtySelectorInput.getAttribute('data-initial-value')) || 0
        : this.count

      const body = {
        updates: {
          [this.variantId]: this.pendingQuantity
        },
        sections: ['cart-ajax']
      }

      try {
        const response = await this.updateCart(body)
        this.handleProductAdded(response, this.pendingQuantity, previousQuantity)
      } catch (error) {
        this.changingQuantity = false
        this.checkShouldClose()
        console.error('Cart update failed:', error)
      }
    }, 100)
  }

  handleProductAdded(response, newQuantity, previousQuantity) {
    this.dispatchEvent(
      new CustomEvent(EVENTS.ajaxProductAdded, {
        bubbles: true,
        detail: {
          product: response,
          preventCartOpen: true
        }
      })
    )

    if (previousQuantity == 0 && newQuantity > 0) {
      this.classList.add(classes.isAdded)
      trapFocus(this.successMessage)
      setTimeout(() => {
        this.handleCartDrawerChange()
      }, 3000)
    }

    if (this.qtySelectorInput) {
      this.qtySelectorInput.setAttribute('data-initial-value', newQuantity)
    }

    this.count = newQuantity
    this.setAttribute('data-count', newQuantity)

    if (this.button) {
      const isDisabled = newQuantity > 0
      this.button.disabled = isDisabled
      this.button.setAttribute('aria-expanded', isDisabled ? 'true' : 'false')
    }

    this.changingQuantity = false

    this.checkShouldClose()
  }

  async updateCart(body) {
    return fetch(`${window.Shopify.routes.root}cart/update.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then((response) => {
      if (!response.ok) throw response
      return response.json()
    })
  }

  handleCartDrawerChange() {
    this.classList.remove(classes.isAdded)
    removeTrapFocus(this.activeElement)
  }

  handleCartUpdated(evt) {
    const cart = evt.detail?.cart
    if (!cart) return

    const cartItem = cart.items?.find((item) => item.variant_id === parseInt(this.variantId))
    const newQuantity = cartItem ? cartItem.quantity : 0

    this.count = newQuantity
    this.setAttribute('data-count', newQuantity)

    if (this.qtySelectorInput) {
      this.qtySelectorInput.value = newQuantity
      this.qtySelector.style.setProperty('--digit-count', `${newQuantity.toString().length}ch`)
      this.qtySelectorInput.setAttribute('data-initial-value', newQuantity)
    }

    if (this.button) {
      const isDisabled = newQuantity > 0
      this.button.disabled = isDisabled
      this.button.setAttribute('aria-expanded', isDisabled ? 'true' : 'false')
    }
  }

  checkShouldClose() {
    const currentQuantity = this.qtySelectorInput ? parseInt(this.qtySelectorInput.value) || 0 : this.count
    if (!this.isHovering && currentQuantity === 0 && !this.changingQuantity && !this.smallContainer) {
      this.button?.setAttribute('aria-expanded', 'false')
    }
  }

  handleResize() {
    if (this?.container?.offsetWidth <= 235) this.smallContainer = true
    else this.smallContainer = false
  }
}

customElements.define('at-add-to-cart', AddToCart)
