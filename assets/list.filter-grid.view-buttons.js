import { EVENTS } from 'util.events'

class GridViewButtons extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController()
    this.viewBtns = this.querySelectorAll('.grid-view-btn')
    this.viewBtns.forEach((btn) => {
      btn.addEventListener('click', this.handleClick.bind(this), { signal: this.abortController.signal })
    })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleClick(event) {
    const btn = event.currentTarget
    this.viewBtns.forEach((el) => {
      el.classList.remove('is-active')
    })
    btn.classList.add('is-active')
    const newView = btn.dataset.view
    this.dispatchEvent(new CustomEvent(EVENTS.viewChange, { detail: { newView }, bubbles: true }))

    this.updateAttribute('product_view', newView)
  }

  updateAttribute(key, value) {
    return fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        attributes: {
          [key]: value
        }
      })
    }).then((response) => {
      if (!response.ok) throw response
      return response.json()
    })
  }
}

customElements.define('grid-view-buttons', GridViewButtons)
