import { executeJSmodules } from 'util.misc'
import { EVENTS } from 'util.events'

/*============================================================================
  CartForm
  - Prevent checkout when terms checkbox exists
  - Listen to quantity changes, rebuild cart (both widget and page)
==============================================================================*/
export default class CartForm {
  constructor(form) {
    this.selectors = {
      products: '[data-products]',
      discounts: '[data-discounts]',
      subTotal: '[data-subtotal]',
      header: '[data-header]',

      locales: '[data-locales]',
      termsCheckbox: '.cart__terms-checkbox',
      checkoutBtn: '.cart__checkout'
    }

    this.classes = {
      btnLoading: 'btn--loading'
    }

    this.config = {
      requiresTerms: false
    }

    if (!form) {
      return
    }

    this.form = form
    this.wrapper = form.parentNode
    this.products = form.querySelector(this.selectors.products)
    this.submitBtn = form.querySelector(this.selectors.checkoutBtn)

    this.discounts = form.querySelector(this.selectors.discounts)
    this.subtotal = form.querySelector(this.selectors.subTotal)
    this.header = form.querySelector(this.selectors.header)
    const termsLabel = form.querySelector(this.selectors.termsCheckbox)
    this.termsCheckbox = termsLabel ? termsLabel.querySelector('input[type="checkbox"]') : null
    this.locales = JSON.parse(this.form.querySelector(this.selectors.locales).textContent)

    if (this.termsCheckbox) {
      this.config.requiresTerms = true
    }

    this.init()
  }

  init() {
    document.addEventListener('cart:quantity', this.quantityChanged.bind(this))

    this.form.addEventListener('submit', this.onSubmit.bind(this))

    // Dev-friendly way to build the cart
    document.addEventListener(
      'cart:build',
      function () {
        this.buildCart()
      }.bind(this)
    )

    // Reset loading state on page load/back navigation
    this.resetLoadingState()
    window.addEventListener('pageshow', this.resetLoadingState.bind(this))
  }

  resetLoadingState() {
    if (this.submitBtn) {
      this.submitBtn.classList.remove(this.classes.btnLoading)
    }
  }

  onSubmit(evt) {
    this.submitBtn.classList.add(this.classes.btnLoading)

    /*
      Checks for drawer or cart open class on body element
      and then stops the form from being submitted.

      Error is handled in the quantityChanged method

      For Expanse/Fetch/Gem/Vino quick add, if an error is present it is alerted
      through the add to cart fetch request in quick-add.js.
    */

    if (
      (document.documentElement.classList.contains('js-drawer-open') && this.cartItemsUpdated) ||
      (document.documentElement.classList.contains('cart-open') && this.cartItemsUpdated)
    ) {
      this.submitBtn.classList.remove(this.classes.btnLoading)
      evt.preventDefault()
      return false
    }

    if (this.config.requiresTerms) {
      if (this.termsCheckbox.checked) {
        // continue to checkout
      } else {
        alert(this.locales.cartTermsConfirmation)
        this.submitBtn.classList.remove(this.classes.btnLoading)
        evt.preventDefault()
        return false
      }
    }
  }

  /*============================================================================
    Query cart page to get markup
  ==============================================================================*/
  _parseProductHTML(text) {
    const html = document.createElement('div')
    html.innerHTML = text

    return {
      items: html.querySelector('.cart__items'),
      discounts: html.querySelector('.cart__discounts'),
      subtotal: html.querySelector('.cart__subtotal'),
      count: html.querySelector('.cart-link__bubble'),
      header: html.querySelector('.cart__header')
    }
  }

  buildCart() {
    return this.getCartProductMarkup().then(this.cartMarkup.bind(this))
  }

  cartMarkup(text) {
    const markup = this._parseProductHTML(text)
    const items = markup.items
    const header = markup.header.innerHTML
    const count = parseInt(items.dataset.count)
    const subtotal = markup.subtotal.innerHTML

    this.updateCartDiscounts(markup.discounts)

    if (count > 0) {
      this.wrapper.classList.remove('is-empty')
    } else {
      this.wrapper.classList.add('is-empty')
    }

    // Append item markup
    this.products.innerHTML = ''
    this.products.append(items)
    const scripts = this.products.querySelectorAll('script[type="module"]')
    executeJSmodules(scripts)

    // Update subtotal
    this.subtotal.innerHTML = subtotal

    // Update header
    if (this.header) this.header.innerHTML = header

    if (Shopify && Shopify.StorefrontExpressButtons) {
      Shopify.StorefrontExpressButtons.initialize()
    }
  }

  updateCartDiscounts(markup) {
    if (!this.discounts) {
      return
    }
    this.discounts.innerHTML = ''
    this.discounts.append(markup)
  }

  quantityChanged(evt) {
    const key = evt.detail[0]
    const qty = evt.detail[1]
    const el = evt.detail[2]

    if (!key || !qty) {
      return
    }

    // Disable qty selector so multiple clicks can't happen while loading
    if (el) {
      el.classList.add('is-loading')
    }

    this.changeItem({
      id: key,
      quantity: qty,
      // Bundled section rendering
      sections: 'cart-ajax'
    })
      .then((state) => {
        this.cartMarkup(state.sections['cart-ajax'])
        document.dispatchEvent(new CustomEvent(EVENTS.cartUpdated, { detail: { cart: state } }))
      })
      .catch(async (response) => {
        const data = await response.json()
        alert(data.description)
        // Enable qty selector again
        el.classList.remove('is-loading')
        // Reset quantity input to initial value
        const input = el.querySelector('.element-quantity-selector__input')
        input.value = input.dataset.initialValue
        el.style.setProperty('--digit-count', `${input.value.toString().length}ch`) 
      })
  }

  changeItem(body) {
    return fetch(`${window.Shopify.routes.root}cart/change.js`, {
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

  getCartProductMarkup() {
    let url = `${window.Shopify.routes.root}?section_id=cart-ajax`

    return fetch(url, {
      credentials: 'same-origin',
      method: 'GET'
    })
      .then((response) => response.text())
      .catch((e) => console.error(e))
  }
}
