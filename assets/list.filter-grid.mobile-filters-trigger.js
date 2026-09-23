import { EVENTS } from 'util.events'
import { unlockMobileScrolling } from 'util.a11y'

class MobileFiltersTrigger extends HTMLElement {
  connectedCallback() {
    this.isOpen = false
    this.abortController = new AbortController()
    unlockMobileScrolling()
    this.trigger = this.querySelector('.collection-filter__btn')
    this.trigger.addEventListener('click', this.handleClick.bind(this), { signal: this.abortController.signal })
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

  handleClick() {
    this.isOpen = !this.isOpen
    this.trigger.classList.toggle('is-active', this.isOpen)
    document.dispatchEvent(new CustomEvent(EVENTS.toggleMobileFilters, { detail: { isOpen: this.isOpen } }))
  }
}

customElements.define('mobile-filters-trigger', MobileFiltersTrigger)
